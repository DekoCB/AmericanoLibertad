<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recibo extends Model
{
    protected $fillable = [
        'pago_id',
        'numero_recibo',
        'pdf_path',
        'emitido_en',
    ];

    protected function casts(): array
    {
        return [
            'emitido_en' => 'datetime',
        ];
    }

    public function pago(): BelongsTo
    {
        return $this->belongsTo(Pago::class);
    }
}
