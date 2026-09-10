<?php

declare(strict_types=1);

namespace App\Modules\Matricula\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class MatriculaMasivaPlantillaExport implements FromArray, WithHeadings
{
    public function headings(): array
    {
        return ['dni', 'carrera', 'ciclo', 'observaciones'];
    }

    public function array(): array
    {
        return [
            ['87654321', 'Enfermería', 'I', ''],
            ['76543210', 'Farmacia', 'II', ''],
        ];
    }
}
