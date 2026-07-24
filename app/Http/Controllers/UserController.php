<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->whereNotIn('role', [UserRole::Docente, UserRole::Estudiante])
            ->when($request->string('user_id')->toString(), function ($query, $userId) {
                $query->where('id', $userId);
            })
            ->with(['teacher', 'student'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $linkedTeacherIds = $users->pluck('teacher_id')->filter()->all();
        $linkedStudentIds = $users->pluck('student_id')->filter()->all();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'allUsers' => User::whereNotIn('role', [UserRole::Docente, UserRole::Estudiante])
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'filters' => $request->only('user_id'),
            'roles' => UserRole::values(),
            'teachers' => Teacher::where(fn ($q) => $q->whereDoesntHave('user')->orWhereIn('id', $linkedTeacherIds))
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'students' => Student::where(fn ($q) => $q->whereDoesntHave('user')->orWhereIn('id', $linkedStudentIds))
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create', [
            'roles' => UserRole::values(),
            'teachers' => Teacher::whereDoesntHave('user')->orderBy('last_name')->get(['id', 'first_name', 'last_name']),
            'students' => Student::whereDoesntHave('user')->orderBy('last_name')->get(['id', 'first_name', 'last_name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $validated = $this->validateUser($request);

        User::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('users.index')->with('success', 'Usuario creado correctamente.');
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => UserRole::values(),
            'teachers' => Teacher::whereDoesntHave('user')
                ->orWhere('id', $user->teacher_id)
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
            'students' => Student::whereDoesntHave('user')
                ->orWhere('id', $user->student_id)
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name']),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $validated = $this->validateUser($request, $user);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()->route('users.index')->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return redirect()->route('users.index')->with('success', 'Usuario eliminado correctamente.');
    }

    private function validateUser(Request $request, ?User $user = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'password' => [$user ? 'nullable' : 'required', Password::defaults()],
            'role' => ['required', Rule::enum(UserRole::class)],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'student_id' => ['nullable', 'exists:students,id'],
        ]);

        if ($validated['role'] !== UserRole::Docente->value) {
            $validated['teacher_id'] = null;
        }

        if ($validated['role'] !== UserRole::Estudiante->value) {
            $validated['student_id'] = null;
        }

        return $validated;
    }
}
