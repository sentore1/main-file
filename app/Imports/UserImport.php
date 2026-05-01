<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Spatie\Permission\Models\Role;

class UserImport
{
    protected $errors = [];
    protected $successCount = 0;
    protected $errorCount = 0;

    public function import($filePath)
    {
        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Skip header row
            $header = array_shift($rows);

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;

                if (empty(array_filter($row))) {
                    continue;
                }

                $data = [
                    'name' => $row[0] ?? null,
                    'email' => $row[1] ?? null,
                    'mobile_no' => $row[2] ?? null,
                    'password' => $row[3] ?? null,
                    'role' => $row[4] ?? 'staff',
                    'is_enable_login' => isset($row[5]) ? (strtolower($row[5]) === 'yes' ? 1 : 0) : 1,
                ];

                $this->importRow($data, $rowNumber);
            }

            return [
                'success' => true,
                'message' => "Import completed. Success: {$this->successCount}, Errors: {$this->errorCount}",
                'errors' => $this->errors,
                'success_count' => $this->successCount,
                'error_count' => $this->errorCount,
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to read Excel file: ' . $e->getMessage(),
                'errors' => [],
                'success_count' => 0,
                'error_count' => 0,
            ];
        }
    }

    protected function importRow($data, $rowNumber)
    {
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile_no' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|string',
        ]);

        if ($validator->fails()) {
            $this->errors[] = [
                'row' => $rowNumber,
                'data' => $data,
                'errors' => $validator->errors()->all(),
            ];
            $this->errorCount++;
            return;
        }

        try {
            $role = Role::where('name', $data['role'])
                ->where('created_by', creatorId())
                ->first();

            if (!$role) {
                $role = Role::where('name', 'staff')
                    ->where('created_by', creatorId())
                    ->first();
            }

            $user = new User();
            $user->name = $data['name'];
            $user->email = $data['email'];
            $user->mobile_no = $data['mobile_no'];
            $user->password = Hash::make($data['password']);
            $user->type = $role->name ?? 'staff';
            $user->is_enable_login = $data['is_enable_login'];
            $user->lang = company_setting('defaultLanguage') ?? 'en';
            $user->email_verified_at = admin_setting('enableEmailVerification') === 'on' ? null : now();
            $user->creator_id = auth()->id();
            $user->created_by = creatorId();
            $user->save();

            if ($role) {
                $user->assignRole($role);
            }

            $this->successCount++;

        } catch (\Exception $e) {
            $this->errors[] = [
                'row' => $rowNumber,
                'data' => $data,
                'errors' => [$e->getMessage()],
            ];
            $this->errorCount++;
        }
    }
}
