<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'correo' => ['required', 'email', 'max:150'],
            'asunto' => ['nullable', 'string', 'max:200'],
            'mensaje' => ['required', 'string', 'max:2000'],
        ]);

        ContactMessage::create($data);

        return back()->with(
            'success',
            'Gracias por escribirnos, te responderemos pronto.',
        );
    }
}
