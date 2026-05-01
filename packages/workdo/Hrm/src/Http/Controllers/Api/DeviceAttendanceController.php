<?php

namespace Workdo\Hrm\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Workdo\Hrm\Models\Employee;
use Workdo\Hrm\Models\Attendance;
use Workdo\Hrm\Models\Shift;
use Carbon\Carbon;

class DeviceAttendanceController extends Controller
{
    use ApiResponseTrait;

    /**
     * Sync attendance records pushed from a fingerprint or RFID card device.
     *
     * Expected request:
     *   Header: X-Device-Token: <token>
     *   Body: {
     *     "device_id": "GATE-1",
     *     "records": [
     *       {
     *         "id": "001",           // biometric_id or card_uid on the device
     *         "type": "fingerprint", // or "card"
     *         "action": "clockin",   // or "clockout"
     *         "time": "2025-12-20 08:05:00"
     *       }
     *     ]
     *   }
     */
    public function sync(Request $request)
    {
        // 1. Authenticate the device — read token directly from DB (no auth context for device requests)
        $tokenSetting = Setting::where('key', 'device_sync_token')->first();
        $token = $tokenSetting ? $tokenSetting->value : null;

        if (!$token || $request->header('X-Device-Token') !== $token) {
            return $this->errorResponse('Unauthorized device.', null, 401);
        }

        // 2. Validate the payload
        $validator = Validator::make($request->all(), [
            'device_id'          => 'required|string',
            'records'            => 'required|array|min:1',
            'records.*.id'       => 'required|string',
            'records.*.type'     => 'required|in:fingerprint,card',
            'records.*.action'   => 'required|in:clockin,clockout',
            'records.*.time'     => 'required|date',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $deviceId  = $request->device_id;
        $processed = 0;
        $skipped   = 0;
        $errors    = [];

        // 3. Process each record
        foreach ($request->records as $index => $record) {
            $idField  = $record['type'] === 'fingerprint' ? 'biometric_id' : 'card_uid';
            $employee = Employee::where($idField, $record['id'])->first();

            if (!$employee) {
                $skipped++;
                $errors[] = "Record #{$index}: No employee found with {$idField} = {$record['id']}";
                continue;
            }

            $time      = Carbon::parse($record['time']);
            $dateStr   = $time->toDateString();
            $createdBy = $employee->created_by;
            $userId    = $employee->user_id;

            if ($record['action'] === 'clockin') {
                $result = $this->handleClockIn($employee, $userId, $createdBy, $time, $dateStr, $deviceId, $record['type']);
            } else {
                $result = $this->handleClockOut($employee, $userId, $createdBy, $time, $dateStr, $deviceId, $record['type']);
            }

            if ($result === true) {
                $processed++;
            } else {
                $skipped++;
                $errors[] = "Record #{$index}: {$result}";
            }
        }

        return $this->successResponse([
            'processed' => $processed,
            'skipped'   => $skipped,
            'errors'    => $errors,
        ], "Sync complete. {$processed} processed, {$skipped} skipped.");
    }

    private function handleClockIn(Employee $employee, int $userId, int $createdBy, Carbon $time, string $dateStr, string $deviceId, string $type): bool|string
    {
        // Auto-close any pending clock-outs from previous days
        $pending = Attendance::where('employee_id', $userId)
            ->whereNull('clock_out')
            ->where('created_by', $createdBy)
            ->get();

        foreach ($pending as $pendingRecord) {
            $shift = Shift::find($employee->shift_id ?? $employee->shift);
            if ($shift) {
                $clockInDate = Carbon::parse($pendingRecord->clock_in)->format('Y-m-d');
                $shiftEnd    = Carbon::parse($clockInDate . ' ' . $shift->end_time);
                if ($shift->end_time < $shift->start_time) {
                    $shiftEnd->addDay();
                }
                $calc = $this->calculateAttendanceData($pendingRecord->clock_in, $shiftEnd, $shift->id, $employee);
                $pendingRecord->update([
                    'clock_out'       => $shiftEnd,
                    'total_hour'      => $calc['total_hour']['total_working_hours'],
                    'break_hour'      => $calc['total_hour']['total_break_hours'],
                    'overtime_hours'  => $calc['overtime_hours'],
                    'overtime_amount' => $calc['overtime_amount'],
                    'status'          => $calc['status'],
                ]);
            }
        }

        // Check if already clocked in today
        $existing = Attendance::where('employee_id', $userId)
            ->where('date', $dateStr)
            ->where('created_by', $createdBy)
            ->first();

        if ($existing && $existing->clock_in) {
            return "Already clocked in on {$dateStr}.";
        }

        $shiftId = $employee->shift_id ?? $employee->shift;

        if ($existing) {
            $existing->update([
                'clock_in'  => $time,
                'source'    => $type,
                'device_id' => $deviceId,
            ]);
        } else {
            Attendance::create([
                'employee_id' => $userId,
                'shift_id'    => $shiftId,
                'date'        => $dateStr,
                'clock_in'    => $time,
                'source'      => $type,
                'device_id'   => $deviceId,
                'creator_id'  => $userId,
                'created_by'  => $createdBy,
            ]);
        }

        return true;
    }

    private function handleClockOut(Employee $employee, int $userId, int $createdBy, Carbon $time, string $dateStr, string $deviceId, string $type): bool|string
    {
        // Find today's attendance or the latest pending one
        $attendance = Attendance::where('employee_id', $userId)
            ->where('date', $dateStr)
            ->where('created_by', $createdBy)
            ->first();

        if (!$attendance || !$attendance->clock_in) {
            $attendance = Attendance::where('employee_id', $userId)
                ->whereNull('clock_out')
                ->where('created_by', $createdBy)
                ->orderBy('clock_in', 'desc')
                ->first();
        }

        if (!$attendance || !$attendance->clock_in) {
            return "No clock-in found for {$dateStr}.";
        }

        if ($attendance->clock_out) {
            return "Already clocked out on {$dateStr}.";
        }

        $shiftId = $employee->shift_id ?? $employee->shift;
        $calc    = $this->calculateAttendanceData($attendance->clock_in, $time, $shiftId, $employee);

        $attendance->update([
            'clock_out'       => $time,
            'total_hour'      => $calc['total_hour']['total_working_hours'],
            'break_hour'      => $calc['total_hour']['total_break_hours'],
            'overtime_hours'  => $calc['overtime_hours'],
            'overtime_amount' => $calc['overtime_amount'],
            'status'          => $calc['status'],
            'source'          => $type,
            'device_id'       => $deviceId,
        ]);

        return true;
    }

    // ─── Attendance Calculation (mirrors AttendanceController logic) ──────────

    private function calculateAttendanceData($clockIn, $clockOut, $shiftId, Employee $employee): array
    {
        $shift         = Shift::find($shiftId);
        $totalHourData = $this->calculateTotalHours($clockIn, $clockOut, $shift);
        $totalHour     = $totalHourData['total_working_hours'];

        $standardHours = ($shift && $this->getWorkingHour($shift) > 0) ? $this->getWorkingHour($shift) : 8;
        $overtimeHours = max(0, round($totalHour - $standardHours, 2));

        $overtimeAmount = 0;
        if ($overtimeHours > 0 && $employee->rate_per_hour) {
            $overtimeAmount = round($overtimeHours * $employee->rate_per_hour, 2);
        }

        $status = 'absent';
        if ($totalHour > 0) {
            $half = $standardHours / 2;
            if ($totalHour >= $standardHours) {
                $status = 'present';
            } elseif ($totalHour >= $half) {
                $status = 'half day';
            }
        }

        return [
            'total_hour'      => $totalHourData,
            'overtime_hours'  => $overtimeHours,
            'overtime_amount' => $overtimeAmount,
            'status'          => $status,
        ];
    }

    private function calculateTotalHours($clockIn, $clockOut, ?Shift $shift): array
    {
        if (!$clockIn || !$clockOut) {
            return ['total_working_hours' => 0, 'total_break_hours' => 0];
        }

        $in  = Carbon::parse($clockIn);
        $out = Carbon::parse($clockOut);

        if ($out->lt($in)) {
            $out->addDay();
        }

        $totalMinutes = abs($out->diffInMinutes($in));
        $breakMinutes = 0;

        if ($shift && $shift->break_start_time && $shift->break_end_time) {
            $breakStart = Carbon::parse($shift->break_start_time);
            $breakEnd   = Carbon::parse($shift->break_end_time);

            if ($breakEnd->lt($breakStart)) {
                $breakEnd->addDay();
            }

            if ($in->lte($breakStart) && $out->gte($breakEnd)) {
                $breakMinutes = $this->breakDuration($shift);
            } elseif ($in->lte($breakStart) && $out->gt($breakStart) && $out->lte($breakEnd)) {
                $breakMinutes = abs($out->diffInMinutes($breakStart));
            } elseif ($in->gt($breakStart) && $in->lt($breakEnd) && $out->gte($breakEnd)) {
                $breakMinutes = abs($breakEnd->diffInMinutes($in));
            }
        }

        return [
            'total_working_hours' => round(max(0, $totalMinutes - $breakMinutes) / 60, 2),
            'total_break_hours'   => round($breakMinutes / 60, 2),
        ];
    }

    private function breakDuration(Shift $shift): int
    {
        $start = Carbon::parse($shift->break_start_time);
        $end   = Carbon::parse($shift->break_end_time);
        if ($end->lt($start)) {
            $end->addDay();
        }
        return abs($end->diffInMinutes($start));
    }

    private function getWorkingHour(Shift $shift): float
    {
        $start = Carbon::parse($shift->start_time);
        $end   = Carbon::parse($shift->end_time);
        if ($shift->is_night_shift && $end->lt($start)) {
            $end->addDay();
        }
        $totalMinutes = abs($end->diffInMinutes($start)) - $this->breakDuration($shift);
        return round(max(0, $totalMinutes) / 60, 2);
    }
}
