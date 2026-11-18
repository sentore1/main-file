<?php

namespace Workdo\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class PosGuestDetail extends Model
{
    protected $table = 'pos_guest_details';

    protected $fillable = [
        'user_id',
        'id_type',
        'id_number',
        'nationality',
        'date_of_birth',
        'gender',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * ID type labels for display.
     */
    public static function idTypeLabels(): array
    {
        return [
            'national_id'      => 'National ID',
            'passport'         => 'Passport',
            'driving_license'  => 'Driving License',
            'other'            => 'Other',
        ];
    }
}
