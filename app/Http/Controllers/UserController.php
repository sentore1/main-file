<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LoginHistory;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\ChangePasswordRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Events\CreateUser;
use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Session;
use App\Imports\UserImport;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class UserController extends Controller
{
    public function index()
    {
        if(Auth::user()->can('manage-users')){
            $users = User::query()
                ->where(function($q) {
                    if(Auth::user()->can('manage-any-users')) {
                        $q->where('created_by', creatorId());
                    } elseif(Auth::user()->can('manage-own-users')) {
                        $q->where('creator_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('name'), fn($q) => $q->where('name', 'like', '%' . request('name') . '%'))
                ->when(request('email'), fn($q) => $q->where('email', 'like', '%' . request('email') . '%'))
                ->when(request('role'), fn($q) => $q->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.role_id', request('role'))
                    ->where('model_has_roles.model_type', User::class))
                ->when(request('is_enable_login') !== null, fn($q) => $q->where('is_enable_login', request('is_enable_login')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->select('users.*')
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $roles = Role::where('created_by', creatorId())->pluck('label', 'id');

            return Inertia::render('users/index', [
                'users' => $users,
                'roles' => $roles,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function store(StoreUserRequest $request)
    {
        if(Auth::user()->can('create-users')){
            $checkUser = canCreateUser();
            if (!$checkUser['can_create']) {
                return redirect()->route('users.index')->with('error', $checkUser['message']);
            }

            $validated = $request->validated();
            $validated['is_enable_login'] = $request->boolean('is_enable_login', true);

            $role = Role::find($validated['type']);
            $enableEmailVerification = admin_setting('enableEmailVerification');

            $user = new User();
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->mobile_no = $validated['mobile_no'];
            $user->password = Hash::make($validated['password']);
            $user->type = Auth::user()->type == 'superadmin' ? 'company' : ($role->name ?? 'staff');
            $user->is_enable_login = $validated['is_enable_login'];
            $user->lang = company_setting('defaultLanguage') ?? 'en';
            $user->email_verified_at = $enableEmailVerification === 'on' ? null : now();
            $user->creator_id = Auth::id();
            $user->created_by = creatorId();
            $user->save();

            if(Auth::user()->type == 'superadmin')
            {
                User::CompanySetting($user->id);
                User::MakeRole($user->id);
                $role = Role::findByName('company');
            }

            $user->assignRole($role);

            // Dispatch event for packages to handle their fields
            CreateUser::dispatch($request, $user);

             // Send welcome email
            if(company_setting('New User') == 'on') {
                $emailData = [
                    'name' => $user->name,
                    'email' => $user->email,
                    'password' => $validated['password'],
                ];

                EmailTemplate::sendEmailTemplate('New User', [$user->email], $emailData);
            }

            if ($enableEmailVerification === 'on') {
                // Apply dynamic mail configuration
                SetConfigEmail(creatorId());
                $user->sendEmailVerificationNotification();
            }

            return redirect()->route('users.index')->with('success', __('The user has been created successfully.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        if(Auth::user()->can('edit-users')){
            $validated = $request->validated();
            $validated['is_enable_login'] = $request->boolean('is_enable_login', true);

            $user->name = $validated['name'];
            $user->email = $validated['email'];
            $user->mobile_no = $validated['mobile_no'];
            $user->is_enable_login = $validated['is_enable_login'];
            $user->save();

            return back()->with('success', __('The user details are updated successfully.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function changePassword(ChangePasswordRequest $request, User $user)
    {
        if(Auth::user()->can('change-password-users') && $user->created_by == creatorId() ){
            $validated = $request->validated();
            $user->password = Hash::make($validated['password']);
            $user->save();

            return redirect()->route('users.index')->with('success', __('The password changed successfully.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(User $user)
    {
        if(Auth::user()->can('delete-users')){
            $user->delete();

            return back()->with('success', __('The user has been deleted.'));
        }
        else{
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }
    }

    public function impersonate(User $user)
    {
        if (Auth::user()->can('impersonate-users'))
        {
            if ($user->id === Auth::id()) {
                return redirect()->route('users.index')->with('error', __('You cannot login as user yourself'));
            }

            if ($user->created_by !== creatorId()) {
                return redirect()->route('users.index')->with('error', __('Permission denied'));
            }

            // Store the original user ID in session
            Session::put('impersonator_id', Auth::id());

            // Login as the target user
            Auth::login($user);
        }
        else
        {
            return redirect()->route('users.index')->with('error', __('Permission denied'));
        }

        return redirect()->route('dashboard')->with('success', __('You are now login as user :name', ['name' => $user->name]));
    }

    public function leaveImpersonation()
    {
        if (!Session::has('impersonator_id')) {
            return redirect()->route('dashboard')->with('error', __('You are not login as user anyone'));
        }

        $originalUserId = Session::get('impersonator_id');
        $originalUser = User::find($originalUserId);

        if (!$originalUser) {
            Session::forget('impersonator_id');
            return redirect()->route('login')->with('error', __('Original user not found'));
        }

        Session::forget('impersonator_id');
        Auth::login($originalUser);

        return redirect()->route('users.index')->with('success', __('You have stopped login as user'));
    }

    public function loginHistory()
    {
        if(Auth::user()->can('view-login-history')){
            $loginHistories = LoginHistory::with('user')
                ->when(Auth::user()->type !== 'superadmin', fn($q) => $q->where('created_by', creatorId()))
                ->when(request('user_name'), fn($q) => $q->whereHas('user', fn($q) => $q->where('name', 'like', '%' . request('user_name') . '%')))
                ->when(request('ip'), fn($q) => $q->where('ip', 'like', '%' . request('ip') . '%'))
                ->when(request('role'), fn($q) => $q->whereHas('user', fn($q) => $q->where('type', request('role'))))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            $roles = Role::where('created_by', creatorId())->pluck('label', 'name');

            return Inertia::render('users/login-history', [
                'loginHistories' => $loginHistories,
                'roles' => $roles,
            ]);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function downloadTemplate()
    {
        if(Auth::user()->can('create-users')){
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Set headers
            $sheet->setCellValue('A1', 'Name');
            $sheet->setCellValue('B1', 'Email');
            $sheet->setCellValue('C1', 'Mobile No');
            $sheet->setCellValue('D1', 'Password');
            $sheet->setCellValue('E1', 'Role');
            $sheet->setCellValue('F1', 'Enable Login (yes/no)');

            // Style header row
            $sheet->getStyle('A1:F1')->getFont()->setBold(true);
            $sheet->getStyle('A1:F1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE0E0E0');

            // Add sample data
            $sheet->setCellValue('A2', 'John Doe');
            $sheet->setCellValue('B2', 'john@example.com');
            $sheet->setCellValue('C2', '+1234567890');
            $sheet->setCellValue('D2', 'password123');
            $sheet->setCellValue('E2', 'staff');
            $sheet->setCellValue('F2', 'yes');

            // Auto-size columns
            foreach(range('A','F') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            $writer = new Xlsx($spreadsheet);
            $fileName = 'user_import_template_' . date('Y-m-d') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), $fileName);
            $writer->save($tempFile);

            return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }

    public function import(Request $request)
    {
        if(Auth::user()->can('create-users')){
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls|max:2048'
            ]);

            $file = $request->file('file');
            $importer = new UserImport();
            $result = $importer->import($file->getRealPath());

            if ($result['success']) {
                if ($result['error_count'] > 0) {
                    return back()->with('warning', $result['message'])->with('import_errors', $result['errors']);
                }
                return back()->with('success', $result['message']);
            } else {
                return back()->with('error', $result['message']);
            }
        }
        else{
            return back()->with('error', __('Permission denied'));
        }
    }
}
