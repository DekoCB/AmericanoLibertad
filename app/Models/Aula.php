<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Aula extends Model
{
    protected $fillable = [
        'nombre',
    ];

    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class, 'aula_id');
    }
}
