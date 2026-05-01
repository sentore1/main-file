<?php

namespace Workdo\Hrm\Http\Controllers;

use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Http\Requests\StoreEmployeeRequest;
use Workdo\Hrm\Http\Requests\UpdateEmployeeRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;
use Workdo\Hrm\Models\Branch;
use Workdo\Hrm\Models\Department;
use Workdo\Hrm\Models\Designation;
use Workdo\Hrm\Models\EmployeeDocumentType;
use Workdo\Hrm\Models\EmployeeDocument;
use Workdo\Hrm\Models\Shift;
use Workdo\Hrm\Events\CreateEmployee;
use Workdo\Hrm\Events\DestroyEmployee;
use Workdo\Hrm\Events\UpdateEmployee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    private function checkEmployeeAccess(Employee $employee)
    {
        if(Auth::user()->can('manage-any-employees')) {
            return $employee->created_by == creatorId();
        } elseif(Auth::user()->can('manage-own-employees')) {
            return ($employee->creator_id == Auth::id() || $employee->user_id == Auth::id());
        }
        return false;
    }

    public function index()
    {
        if (Auth::user()->can('manage-employees')) {
            $employees = Employee::query()
                ->with(['user:id,name,avatar,is_disable', 'branch', 'department', 'designation', 'shift'])
                ->where(function ($q) {
                    if (Auth::user()->can('manage-any-employees')) {
                        $q->where('created_by', creatorId());
                    } elseif (Auth::user()->can('manage-own-employees')) {
                        $q->where('creator_id',Auth::id())->orWhere('user_id', Auth::id());
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                })
                ->when(request('employee_id'), function ($q) {
                    $q->where(function ($query) {
                        $query->where('employee_id', 'like', '%' . request('employee_id') . '%');
                        $query->orWhereHas('user', function($userQuery) {
                            $userQuery->where('name', 'like', '%' . request('employee_id') . '%');
                        });
                    });
                })
                ->when(request('branch_id') && request('branch_id') !== 'all', fn($q) => $q->where('branch_id', request('branch_id')))
                ->when(request('department_id') && request('department_id') !== 'all', fn($q) => $q->where('department_id', request('department_id')))
                ->when(request('employment_type') !== null && request('employment_type') !== '', fn($q) => $q->where('employment_type', request('employment_type')))
                ->when(request('gender') !== null && request('gender') !== '', fn($q) => $q->where('gender', request('gender')))
                ->when(request('sort'), fn($q) => $q->orderBy(request('sort'), request('direction', 'asc')), fn($q) => $q->latest())
                ->paginate(request('per_page', 10))
                ->withQueryString();

            return Inertia::render('Hrm/Employees/Index', [
                'employees' => $employees,
                'users' => User::where('created_by', creatorId())->whereNotIn('type', ['super admin', 'company', 'client', 'vendor'])->select('id', 'name')->get(),
                'branches' => Branch::where('created_by', creatorId())->select('id', 'branch_name')->get(),
                'departments' => Department::where('created_by', creatorId())->select('id', 'department_name', 'branch_id')->get(),
                'designations' => Designation::where('created_by', creatorId())->select('id', 'designation_name', 'branch_id', 'department_id')->get(),
                'shifts' => Shift::where('created_by', creatorId())->select('id', 'shift_name')->get(),
            ]);
        } else {
            return back()->with('error', __('Permission denied'));
        }
    }

    public function create()
    {
        if (Auth::user()->can('create-employees')) {
            $assignedUserIds = Employee::where('created_by', creatorId())
                ->pluck('user_id')
                ->filter(function($id) {
                    return !is_null($id);
                })
                ->toArray();

            $users = User::where('created_by', creatorId())
                ->whereNotIn('type', ['super admin', 'company', 'client', 'vendor'])
                ->whereNotIn('id', $assignedUserIds)
                ->select('id', 'name')
                ->get();

            return Inertia::render('Hrm/Employees/Create', [
                'users' => $users,
                'branches' => Branch::where('created_by', creatorId())->select('id', 'branch_name')->get(),
                'departments' => Department::where('created_by', creatorId())->select('id', 'department_name', 'branch_id')->get(),
                'designations' => Designation::where('created_by', creatorId())->select('id', 'designation_name', 'branch_id', 'department_id')->get(),
                'shifts' => Shift::where('created_by', creatorId())->select('id', 'shift_name')->get(),
                'documentTypes' => EmployeeDocumentType::where('created_by', creatorId())->select('id', 'document_name', 'is_required')->get(),
                'generatedEmployeeId' => Employee::generateEmployeeId(),
                'referenceData' => [
                    'users' => User::where('created_by', creatorId())
                        ->whereNotIn('type', ['super admin', 'company', 'client', 'vendor'])
                        ->whereNotIn('id', $assignedUserIds)
                        ->select('id', 'name', 'email')
                        ->get(),
                    'branches' => Branch::where('created_by', creatorId())->select('id', 'branch_name')->get(),
                    'departments' => Department::where('created_by', creatorId())->select('id', 'department_name')->get(),
                    'designations' => Designation::where('created_by', creatorId())->select('id', 'designation_name')->get(),
                    'shifts' => Shift::where('created_by', creatorId())->select('id', 'shift_name')->get(),
                ],
            ]);
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function store(StoreEmployeeRequest $request)
    {
        if (Auth::user()->can('create-employees')) {
            $validated = $request->validated();
            $employee = new Employee();
            $employee->employee_id = $validated['employee_id'];
            $employee->date_of_birth = $validated['date_of_birth'];
            $employee->gender = $validated['gender'];
            $employee->shift = $validated['shift_id'];
            $employee->date_of_joining = $validated['date_of_joining'];
            $employee->employment_type = $validated['employment_type'];
            $employee->address_line_1 = $validated['address_line_1'];
            $employee->address_line_2 = $validated['address_line_2'];
            $employee->city = $validated['city'];
            $employee->state = $validated['state'];
            $employee->country = $validated['country'];
            $employee->postal_code = $validated['postal_code'];
            $employee->emergency_contact_name = $validated['emergency_contact_name'];
            $employee->emergency_contact_relationship = $validated['emergency_contact_relationship'];
            $employee->emergency_contact_number = $validated['emergency_contact_number'];
            $employee->bank_name = $validated['bank_name'];
            $employee->account_holder_name = $validated['account_holder_name'];
            $employee->account_number = $validated['account_number'];
            $employee->bank_identifier_code = $validated['bank_identifier_code'];
            $employee->bank_branch = $validated['bank_branch'];
            $employee->tax_payer_id = $validated['tax_payer_id'];
            $employee->basic_salary = $validated['basic_salary'];
            $employee->hours_per_day = $validated['hours_per_day'];
            $employee->days_per_week = $validated['days_per_week'];
            $employee->rate_per_hour = $validated['rate_per_hour'];
            $employee->user_id = $validated['user_id'];
            $employee->branch_id = $validated['branch_id'];
            $employee->department_id = $validated['department_id'];
            $employee->designation_id = $validated['designation_id'];

            $employee->creator_id = Auth::id();
            $employee->created_by = creatorId();
            $employee->save();

            CreateEmployee::dispatch($request, $employee);

            // Store documents
            if ($request->has('documents')) {
                foreach ($request->input('documents', []) as $index => $document) {
                    if ($request->hasFile("documents.{$index}.file") && !empty($document['document_type_id'])) {
                        $file = $request->file("documents.{$index}.file");

                        $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                        $extension = $file->getClientOriginalExtension();
                        $fileNameToStore = $filename . '_' . time() . '.' . $extension;

                        $upload = upload_file($request, "documents.{$index}.file", $fileNameToStore, 'employee_documents');

                        if (isset($upload['flag']) && $upload['flag'] == 1 && isset($upload['url'])) {
                            EmployeeDocument::create([
                                'user_id' => $employee->id,
                                'document_type_id' => $document['document_type_id'],
                                'file_path' => $upload['url'],
                                'creator_id' => Auth::id(),
                                'created_by' => creatorId(),
                            ]);
                        }
                    }
                }
            }

            return redirect()->route('hrm.employees.index')->with('success', __('The employee has been created successfully.'));
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function edit(Employee $employee)
    {
        if (Auth::user()->can('edit-employees')) {
            if(!$this->checkEmployeeAccess($employee)) {
                return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
            }
            $existingDocuments = EmployeeDocument::where('user_id', $employee->id)
                ->with('documentType')
                ->get()
                ->map(function ($doc) {
                    return [
                        'id' => $doc->id,
                        'document_type_id' => $doc->document_type_id,
                        'file_path' => $doc->file_path,
                        'document_name' => $doc->documentType->document_name ?? '',
                    ];
                });

            return Inertia::render('Hrm/Employees/Edit', [
                'employee' => $employee,
                'users' => User::where('created_by', creatorId())->whereNotIn('type', ['super admin', 'company', 'client', 'vendor'])->select('id', 'name')->get(),
                'branches' => Branch::where('created_by', creatorId())->select('id', 'branch_name')->get(),
                'departments' => Department::where('created_by', creatorId())->select('id', 'department_name', 'branch_id')->get(),
                'designations' => Designation::where('created_by', creatorId())->select('id', 'designation_name', 'branch_id', 'department_id')->get(),
                'shifts' => Shift::where('created_by', creatorId())->select('id', 'shift_name')->get(),
                'documentTypes' => EmployeeDocumentType::where('created_by', creatorId())->select('id', 'document_name', 'is_required')->get(),
                'existingDocuments' => $existingDocuments,
            ]);
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee)
    { 
        if (Auth::user()->can('edit-employees')) {
            $validated = $request->validated();
            $employee->date_of_birth = $validated['date_of_birth'];
            $employee->gender = $validated['gender'];
            $employee->shift = $validated['shift_id'];
            $employee->date_of_joining = $validated['date_of_joining'];
            $employee->employment_type = $validated['employment_type'];
            $employee->address_line_1 = $validated['address_line_1'];
            $employee->address_line_2 = $validated['address_line_2'];
            $employee->city = $validated['city'];
            $employee->state = $validated['state'];
            $employee->country = $validated['country'];
            $employee->postal_code = $validated['postal_code'];
            $employee->emergency_contact_name = $validated['emergency_contact_name'];
            $employee->emergency_contact_relationship = $validated['emergency_contact_relationship'];
            $employee->emergency_contact_number = $validated['emergency_contact_number'];
            $employee->bank_name = $validated['bank_name'];
            $employee->account_holder_name = $validated['account_holder_name'];
            $employee->account_number = $validated['account_number'];
            $employee->bank_identifier_code = $validated['bank_identifier_code'];
            $employee->bank_branch = $validated['bank_branch'];
            $employee->tax_payer_id = $validated['tax_payer_id'];
            $employee->basic_salary = $validated['basic_salary'];
            $employee->hours_per_day = $validated['hours_per_day'];
            $employee->days_per_week = $validated['days_per_week'];
            $employee->rate_per_hour = $validated['rate_per_hour'];
            $employee->branch_id = $validated['branch_id'];
            $employee->department_id = $validated['department_id'];
            $employee->designation_id = $validated['designation_id'];

            $employee->save();

            UpdateEmployee::dispatch($request, $employee);

            // Handle document updates
            if ($request->has('documents')) {
                foreach ($request->input('documents', []) as $index => $document) {
                    if ($request->hasFile("documents.{$index}.file") && !empty($document['document_type_id'])) {
                        $file = $request->file("documents.{$index}.file");

                        $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                        $extension = $file->getClientOriginalExtension();
                        $fileNameToStore = $filename . '_' . time() . '.' . $extension;

                        $upload = upload_file($request, "documents.{$index}.file", $fileNameToStore, 'employee_documents');

                        if (isset($upload['flag']) && $upload['flag'] == 1 && isset($upload['url'])) {
                            EmployeeDocument::create([
                                'user_id' => $employee->id,
                                'document_type_id' => $document['document_type_id'],
                                'file_path' => $upload['url'],
                                'creator_id' => Auth::id(),
                                'created_by' => creatorId(),
                            ]);
                        }
                    }
                }
            }

            return redirect()->route('hrm.employees.index')->with('success', __('The employee details are updated successfully.'));
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function destroy(Employee $employee)
    {
        if (Auth::user()->can('delete-employees')) {
            DestroyEmployee::dispatch($employee);
            $employee->delete();

            return redirect()->back()->with('success', __('The employee has been deleted.'));
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function show(Employee $employee)
    {
        if (Auth::user()->can('view-employees')) {
            if(!$this->checkEmployeeAccess($employee)) {
                return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
            }
            $employee->load(['user:id,name,email,avatar', 'branch', 'department', 'designation', 'shift']);
            
            $documents = EmployeeDocument::where('user_id', $employee->id)
                ->with('documentType')
                ->get()
                ->map(function($doc) {
                    return [
                        'id' => $doc->id,
                        'document_type_id' => $doc->document_type_id,
                        'file_path' => $doc->file_path,
                        'document_name' => $doc->documentType->document_name ?? '',
                    ];
                });

            return Inertia::render('Hrm/Employees/Show', [
                'employee' => $employee,
                'documents' => $documents,
            ]);
        } else {
            return redirect()->route('hrm.employees.index')->with('error', __('Permission denied'));
        }
    }

    public function deleteDocument($employeeId, EmployeeDocument $document)
    {
        if (Auth::user()->can('edit-employees')) {
            if ($document->user_id != $employeeId) {
                return redirect()->back()->with('error', __('Document not found'));
            }

            delete_file($document->file_path);
            $document->delete();

            return redirect()->back()->with('success', __('Document deleted successfully'));
        } else {
            return redirect()->back()->with('error', __('Permission denied'));
        }
    }

    public function bulkImport(Request $request)
    {
        if (!Auth::user()->can('create-employees')) {
            return back()->with('error', __('Permission denied'));
        }

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        // Log the file details for debugging
        \Log::info('File upload attempt', [
            'original_name' => $request->file('file')->getClientOriginalName(),
            'mime_type' => $request->file('file')->getMimeType(),
            'extension' => $request->file('file')->getClientOriginalExtension(),
        ]);

        // Validate CSV specifically
        if (!in_array($request->file('file')->getClientOriginalExtension(), ['csv'])) {
            return back()->with('error', __('Only CSV files are allowed.'));
        }

        try {
            $file = $request->file('file');
            $data = [];

            // Read CSV file only
            $handle = fopen($file->getRealPath(), 'r');
            
            if (!$handle) {
                return back()->with('error', __('Unable to read the file.'));
            }

            $header = fgetcsv($handle);
                
            if (!$header) {
                fclose($handle);
                return back()->with('error', __('The file is empty or invalid.'));
            }

            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) === count($header)) {
                    $data[] = array_combine($header, $row);
                }
            }
            fclose($handle);

            if (empty($data)) {
                return back()->with('error', __('No valid data found in the file.'));
            }

            $imported = 0;
            $skipped = 0;
            $errors = [];
            $requiredColumns = ['user_id', 'date_of_birth', 'gender', 'shift_id', 'employment_type', 'branch_id', 'department_id', 'designation_id', 'basic_salary'];
            
            // Check if all required columns exist
            $missingColumns = array_diff($requiredColumns, array_keys($data[0]));
            if (!empty($missingColumns)) {
                return back()->with('error', __('Missing required columns: :columns', ['columns' => implode(', ', $missingColumns)]));
            }

            foreach ($data as $index => $row) {
                $rowNumber = $index + 2;
                
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Skip instruction rows (rows that start with "INSTRUCTIONS" or "DELETE")
                if (isset($row['user_id']) && (stripos($row['user_id'], 'INSTRUCTION') !== false || stripos($row['user_id'], 'DELETE') !== false)) {
                    continue;
                }

                // Check if user already has an employee record
                $existingEmployee = Employee::where('user_id', $row['user_id'] ?? null)
                    ->where('created_by', creatorId())
                    ->first();
                
                if ($existingEmployee) {
                    $errors[] = "Row {$rowNumber}: User ID {$row['user_id']} already has an employee record (Employee ID: {$existingEmployee->employee_id})";
                    $skipped++;
                    continue;
                }

                // Validate the row data
                $validator = Validator::make($row, [
                    'user_id' => 'required|exists:users,id',
                    'date_of_birth' => 'required|date|before:today',
                    'gender' => 'required|in:Male,Female,Other',
                    'shift_id' => 'required|exists:shifts,id',
                    'employment_type' => 'required|in:Full Time,Part Time,Temporary,Contract',
                    'branch_id' => 'required|exists:branches,id',
                    'department_id' => 'required|exists:departments,id',
                    'designation_id' => 'required|exists:designations,id',
                    'basic_salary' => 'required|numeric|min:0',
                    'hours_per_day' => 'nullable|numeric|min:0|max:24',
                    'days_per_week' => 'nullable|numeric|min:0|max:7',
                    'rate_per_hour' => 'nullable|numeric|min:0',
                    'date_of_joining' => 'nullable|date',
                ]);

                if ($validator->fails()) {
                    $errors[] = "Row {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    $skipped++;
                    continue;
                }

                try {
                    $employee = new Employee();
                    $employee->employee_id = !empty($row['employee_id']) ? $row['employee_id'] : Employee::generateEmployeeId();
                    $employee->date_of_birth = $row['date_of_birth'];
                    $employee->gender = $row['gender'];
                    $employee->shift = $row['shift_id'];
                    $employee->date_of_joining = !empty($row['date_of_joining']) ? $row['date_of_joining'] : now()->format('Y-m-d');
                    $employee->employment_type = $row['employment_type'];
                    $employee->address_line_1 = $row['address_line_1'] ?? '';
                    $employee->address_line_2 = $row['address_line_2'] ?? '';
                    $employee->city = $row['city'] ?? '';
                    $employee->state = $row['state'] ?? '';
                    $employee->country = $row['country'] ?? '';
                    $employee->postal_code = $row['postal_code'] ?? '';
                    $employee->emergency_contact_name = $row['emergency_contact_name'] ?? '';
                    $employee->emergency_contact_relationship = $row['emergency_contact_relationship'] ?? '';
                    $employee->emergency_contact_number = $row['emergency_contact_number'] ?? '';
                    $employee->bank_name = $row['bank_name'] ?? '';
                    $employee->account_holder_name = $row['account_holder_name'] ?? '';
                    $employee->account_number = $row['account_number'] ?? '';
                    $employee->bank_identifier_code = $row['bank_identifier_code'] ?? '';
                    $employee->bank_branch = $row['bank_branch'] ?? '';
                    $employee->tax_payer_id = $row['tax_payer_id'] ?? '';
                    $employee->basic_salary = $row['basic_salary'];
                    $employee->hours_per_day = !empty($row['hours_per_day']) ? $row['hours_per_day'] : 8;
                    $employee->days_per_week = !empty($row['days_per_week']) ? $row['days_per_week'] : 5;
                    $employee->rate_per_hour = !empty($row['rate_per_hour']) ? $row['rate_per_hour'] : 0;
                    $employee->user_id = $row['user_id'];
                    $employee->branch_id = $row['branch_id'];
                    $employee->department_id = $row['department_id'];
                    $employee->designation_id = $row['designation_id'];
                    $employee->biometric_id = $row['biometric_id'] ?? '';
                    $employee->card_uid = $row['card_uid'] ?? '';
                    $employee->creator_id = Auth::id();
                    $employee->created_by = creatorId();
                    $employee->save();

                    CreateEmployee::dispatch($request, $employee);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row {$rowNumber}: Failed to save - " . $e->getMessage();
                    $skipped++;
                }
            }

            // Build response message
            if ($imported > 0 && $skipped === 0) {
                return back()->with('success', __(':count employees imported successfully.', ['count' => $imported]));
            } elseif ($imported > 0 && $skipped > 0) {
                $message = __(':imported employees imported successfully. :skipped rows skipped.', ['imported' => $imported, 'skipped' => $skipped]);
                if (!empty($errors)) {
                    $message .= ' Errors: ' . implode(' | ', array_slice($errors, 0, 5));
                    if (count($errors) > 5) {
                        $message .= ' ... and ' . (count($errors) - 5) . ' more errors.';
                    }
                }
                return back()->with('warning', $message);
            } else {
                $message = __('No employees were imported. :skipped rows skipped.', ['skipped' => $skipped]);
                if (!empty($errors)) {
                    $message .= ' Errors: ' . implode(' | ', array_slice($errors, 0, 5));
                    if (count($errors) > 5) {
                        $message .= ' ... and ' . (count($errors) - 5) . ' more errors.';
                    }
                }
                return back()->with('error', $message);
            }
        } catch (\Exception $e) {
            return back()->with('error', __('Import failed: :message', ['message' => $e->getMessage()]));
        }
    }

    public function downloadTemplate()
    {
        if (!Auth::user()->can('create-employees')) {
            return back()->with('error', __('Permission denied'));
        }

        $headers = [
            'user_id',
            'date_of_birth',
            'gender',
            'biometric_id',
            'card_uid',
            'shift_id',
            'date_of_joining',
            'employment_type',
            'address_line_1',
            'address_line_2',
            'city',
            'state',
            'country',
            'postal_code',
            'emergency_contact_name',
            'emergency_contact_relationship',
            'emergency_contact_number',
            'bank_name',
            'account_holder_name',
            'account_number',
            'bank_identifier_code',
            'bank_branch',
            'tax_payer_id',
            'basic_salary',
            'hours_per_day',
            'days_per_week',
            'rate_per_hour',
            'branch_id',
            'department_id',
            'designation_id',
        ];

        // Get sample IDs from database for reference
        $sampleUser = User::where('created_by', creatorId())
            ->whereNotIn('type', ['super admin', 'company', 'client', 'vendor'])
            ->first();
        $sampleBranch = Branch::where('created_by', creatorId())->first();
        $sampleDepartment = Department::where('created_by', creatorId())->first();
        $sampleDesignation = Designation::where('created_by', creatorId())->first();
        $sampleShift = Shift::where('created_by', creatorId())->first();

        $sampleData = [
            $sampleUser->id ?? '1',
            '1990-01-15',
            'Male',
            'BIO001',
            'CARD001',
            $sampleShift->id ?? '1',
            date('Y-m-d'),
            'Full Time',
            '123 Main Street',
            'Apt 4B',
            'Kigali',
            'Kigali',
            'Rwanda',
            '10001',
            'John Doe',
            'Father',
            '+250788123456',
            'Bank of Kigali',
            'Jane Smith',
            '1234567890',
            'BKRWRWRW',
            'Kigali Branch',
            'TAX123456',
            '500000',
            '8',
            '5',
            '2500',
            $sampleBranch->id ?? '1',
            $sampleDepartment->id ?? '1',
            $sampleDesignation->id ?? '1',
        ];

        $filename = 'employee_import_template_' . date('Y-m-d') . '.csv';
        
        return response()->streamDownload(function() use ($headers, $sampleData) {
            $handle = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to handle special characters properly
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Write headers
            fputcsv($handle, $headers);
            
            // Write sample data
            fputcsv($handle, $sampleData);
            
            // Write instruction row (DELETE THIS ROW BEFORE UPLOAD)
            $instructions = [
                'DELETE THIS ROW! User ID (required)',
                'YYYY-MM-DD (required)',
                'Male/Female/Other (required)',
                'Optional - Fingerprint ID',
                'Optional - RFID Card',
                'Shift ID (required)',
                'YYYY-MM-DD (optional)',
                'Full Time/Part Time/Temporary/Contract (required)',
                'Required',
                'Optional',
                'Required',
                'Required',
                'Required',
                'Required',
                'Required',
                'Required',
                '+250XXXXXXXXX (required)',
                'Optional',
                'Optional',
                'Optional',
                'Optional',
                'Optional',
                'Optional',
                'Numeric (required)',
                'Default: 8',
                'Default: 5',
                'Default: 0',
                'Branch ID (required)',
                'Department ID (required)',
                'Designation ID (required)',
            ];
            fputcsv($handle, $instructions);
            
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
