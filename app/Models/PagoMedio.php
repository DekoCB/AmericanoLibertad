<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoMedio extends Model
{
    protected $fillable = [
        'pago_id',
        'medio',
        'monto',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'float',
        ];
    }

    public function pago(): BelongsTo
    {
        return $this->belongsTo(Pago::class);
    }
}
