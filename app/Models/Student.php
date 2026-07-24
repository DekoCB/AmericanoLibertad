<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory;

    protected $fillable = [
        'document_number',
        'qr_token',
        'first_name',
        'last_name',
        'email',
        'phone',
        'birth_date',
        'address',
        'status',
        'carrera_id',
        'ciclo',
        'turno',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Student $student) {
            if (! $student->qr_token) {
                $student->qr_token = (string) Str::uuid();
            }
        });
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function asistencias(): HasMany
    {
        return $this->hasMany(Asistencia::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class);
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }
}
