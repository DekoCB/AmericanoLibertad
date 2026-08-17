# Guía de despliegue a Hostinger (plan compartido, sin SSH)

Checklist para subir el Instituto Americano Libertad a producción en Hostinger,
pensado para un plan compartido sin acceso a terminal ni a Node.js en el
servidor.

---

## 0. Antes de empezar (en tu computadora)

- [ ] Corre `npm run build` en el proyecto local. Esto genera la carpeta
      `public/build/` con los assets compilados (JS/CSS). **No está en Git**,
      así que la vas a subir a mano en el paso 4.
- [ ] Exporta tu base de datos local con phpMyAdmin de XAMPP
      (`http://localhost/phpmyadmin` → selecciona la base de datos →
      **Exportar** → formato SQL → Ejecutar). Guarda el archivo `.sql`.
      Esto te permite llevar toda la data real (carreras, cursos, profesores,
      matrículas) a producción sin volver a crearla.

---

## 1. Configurar PHP en hPanel

1. Entra a **hPanel → Avanzado → Configuración de PHP**.
2. Selecciona **PHP 8.2** o superior (el proyecto requiere `^8.2`).

---

## 2. Crear la base de datos MySQL

1. **hPanel → Bases de datos → Bases de datos MySQL**.
2. Crea una base de datos nueva y un usuario, y anota:
   - Nombre de la base de datos
   - Usuario
   - Contraseña
   - Host (normalmente `localhost`)
3. Abre **phpMyAdmin** desde hPanel, entra a la base de datos recién creada,
   y usa **Importar** para subir el `.sql` que exportaste en el paso 0.
   - Si prefieres empezar con la base de datos vacía (sin la data que ya
     armamos), puedes saltarte este import y usar la ruta `/deploy-setup`
     del paso 6 para correr las migraciones desde cero.

---

## 3. Subir los archivos del proyecto

1. Sube todo el proyecto por FTP o el **Administrador de archivos** de
   hPanel, **excepto**: `node_modules/`, `.git/`, `.env` (local), y
   `storage/*.key`.
2. **`vendor/`** (dependencias de Composer): como no hay SSH, tienes dos
   opciones:
   - Revisa si hPanel tiene la herramienta **Composer** (varios planes de
     Hostinger, incluso compartidos, la incluyen bajo Avanzado). Si está,
     súbelo todo sin `vendor/` y corre `composer install --no-dev` desde ahí.
   - Si no está disponible, corre `composer install --no-dev` en tu
     computadora y sube la carpeta `vendor/` completa por FTP (pesa varios
     MB, puede tardar).
3. **`public/build/`**: sube la carpeta que generaste en el paso 0.

---

## 4. Configurar el dominio (document root)

El dominio debe apuntar a la carpeta **`public/`** del proyecto, no a la raíz.

- Si tu plan permite cambiar el **Document Root** del dominio (hPanel →
  Sitios web → Configuración avanzada), apúntalo a `.../public`.
- Si tu plan **no** lo permite (solo `public_html` como raíz fija):
  1. Copia todo el **contenido** de la carpeta `public/` del proyecto dentro
     de `public_html/`.
  2. Edita `public_html/index.php` y cambia las dos rutas que apuntan a
     `__DIR__.'/../vendor/autoload.php'` y
     `__DIR__.'/../bootstrap/app.php'` para que apunten a donde subiste el
     resto del proyecto (fuera de `public_html`, un nivel más arriba de lo
     normal según dónde lo hayas puesto).

---

## 5. Configurar el `.env` del servidor

Crea un archivo `.env` en la raíz del proyecto en el servidor (cópialo de
`.env.example` y ajusta):

```env
APP_NAME="Instituto Americano Libertad"
APP_ENV=production
APP_KEY=                      # lo genera el paso 6
APP_DEBUG=false
APP_URL=https://tudominio.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=tu_base_de_datos
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

MAIL_MAILER=log

# Solo mientras uses la ruta de instalación del paso 6:
DEPLOY_SETUP_TOKEN=un-valor-largo-y-aleatorio-que-inventes
```

---

## 6. Generar la `APP_KEY` y correr el setup

Como no hay SSH, todo esto se hace visitando URLs desde el navegador:

1. **Generar `APP_KEY`**: si tu plan tiene la herramienta Composer (paso 3),
   puedes correr `php artisan key:generate` desde ahí. Si no, genera una
   clave base64 de 32 bytes con cualquier generador y pégala manualmente
   como `APP_KEY=base64:...` en el `.env`.
2. Visita en el navegador:

   ```
   https://tudominio.com/deploy-setup/EL-TOKEN-QUE-PUSISTE-EN-DEPLOY_SETUP_TOKEN
   ```

   Esto corre `migrate` (crea las tablas que falten, no borra nada existente)
   y `storage:link` (necesario para que se vean las fotos de perfil y los
   archivos subidos al aula virtual).
3. Verás un resumen en texto plano confirmando que corrió bien.
4. **Borra `DEPLOY_SETUP_TOKEN` del `.env`** (o déjalo vacío) para desactivar
   la ruta de nuevo — sin el token, `/deploy-setup/...` responde 404.

---

## 7. Antes de anunciar el sitio

- [ ] Cambia la contraseña (o elimina) a los usuarios de prueba: Gerencia
      Demo, Administrativo Demo, Coordinador Demo, Académico Demo, Docente
      Demo, Estudiante Demo.
- [ ] Entra con un usuario real y confirma que el login, el dashboard y una
      foto de perfil / archivo del aula virtual se ven correctamente
      (confirma que el paso `storage:link` funcionó).
- [ ] Revisa que `APP_DEBUG=false` — si algo falla, debe mostrarse la página
      de error del instituto, no un stack trace de Laravel.

---

## Referencia rápida de comandos que evitas con `/deploy-setup`

Si en algún momento consigues acceso SSH (por ejemplo, si migras a un plan
VPS/Cloud de Hostinger), estos son los comandos equivalentes a correr:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
```
