<?php

/*
 * Datos fiscales/institucionales que se imprimen en el encabezado de los
 * recibos (ticket y A4). Se leen del .env para poder corregirlos sin tocar
 * código; si se define INSTITUCION_RUC vacío, la línea "RUC" simplemente no se imprime.
 */
return [
    'razon_social' => env('INSTITUCION_RAZON_SOCIAL', 'Instituto Superior Tecnológico Privado Americano Libertad'),
    'nombre_corto' => env('INSTITUCION_NOMBRE_CORTO', 'Instituto Americano Libertad'),
    'ruc' => env('INSTITUCION_RUC', '10456641194'),
    'direccion' => env('INSTITUCION_DIRECCION', 'Sector, Tumán 14601'),
    'telefono' => env('INSTITUCION_TELEFONO', '+51 900 512 553'),
];
