const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias al DOM
const form = document.getElementById('resetForm');
const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const inputs = document.querySelectorAll('input');

// 1. BLOQUEAR EL FORMULARIO AL INICIO (Para evitar el error "Auth session missing")
submitBtn.disabled = true;
inputs.forEach(input => input.disabled = true);
submitBtn.innerHTML = '<span class="loader"></span> Verificando enlace...';

// 2. ESCUCHAR EL ESTADO DE LA SESIÓN
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento de Auth:", event); // Para depuración

    // Si detectamos recuperación o inicio de sesión exitoso, ACTIVAMOS el formulario
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) {
        submitBtn.disabled = false;
        inputs.forEach(input => input.disabled = false);
        submitBtn.innerHTML = 'Restablecer Contraseña';
    } else {
        // Si no hay sesión, mantenemos bloqueado (probablemente el link expiró)
        // No mostramos error aún, damos un momento por si la carga es lenta.
    }
});

// 3. MANEJAR EL ENVÍO DEL FORMULARIO
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }

    // UI: Mostrar carga
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Actualizando...';

    try {
        // Intentar actualizar
        const { data, error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) throw error;

        // Éxito
        successDiv.textContent = '¡Contraseña actualizada! Ya puedes iniciar sesión en la App.';
        successDiv.style.display = 'block';
        form.reset();
        
    } catch (error) {
        console.error(error);
        showError(error.message || 'Error al actualizar. Intenta solicitar un nuevo correo.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Restablecer Contraseña';
    }
});

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
}

// 4. CHECK DE SEGURIDAD EXTRA
// Si pasan 4 segundos y no hay sesión, avisamos al usuario.
setTimeout(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session && submitBtn.disabled) {
        showError('No se detectó una sesión válida. El enlace puede haber expirado o ya fue usado. Solicita uno nuevo desde la App.');
        submitBtn.innerHTML = 'Enlace Inválido';
    }
}, 4000);