<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForoRespuesta extends Model
{
    protected $fillable = [
        'foro_tema_id',
        'user_id',
        'contenido',
    ];

    public function foroTema(): BelongsTo
    {
        return $this->belongsTo(ForoTema::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
