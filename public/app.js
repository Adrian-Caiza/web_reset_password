// TUS CREDENCIALES (Las que vi en tu archivo son correctas)
const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias del DOM
const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const inputs = document.querySelectorAll('input');
const form = document.getElementById('resetForm');

// 1. BLOQUEAR TODO AL INICIO (Crucial para evitar "Auth session missing")
submitBtn.disabled = true;
inputs.forEach(i => i.disabled = true);
submitBtn.innerHTML = '<span class="loader"></span> Verificando enlace...';

// Función auxiliar de error
function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    submitBtn.innerHTML = 'Enlace Inválido';
    submitBtn.disabled = true; // Mantener bloqueado si hay error
}

// 2. ESCUCHAR SI LLEGA LA SESIÓN
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth detectado:", event); 
    
    // Si Supabase encuentra el token y recupera la sesión:
    if (session) {
        submitBtn.disabled = false;
        inputs.forEach(i => i.disabled = false);
        submitBtn.innerHTML = 'Restablecer Contraseña';
        errorDiv.style.display = 'none'; // Limpiar errores previos
    }
});

// 3. MANEJAR EL ENVÍO
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }

    // Bloquear mientras se guarda
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Guardando...';

    try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        
        successDiv.textContent = '¡Listo! Contraseña actualizada correctamente.';
        successDiv.style.display = 'block';
        form.reset();
        
    } catch (err) {
        console.error(err);
        // Si sale "Auth session missing" aquí, es porque la sesión se perdió
        errorDiv.textContent = err.message || 'Error al actualizar.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Intentar de nuevo';
    }
});

// 4. CHECK DE SEGURIDAD (Timeout)
setTimeout(() => {
    // Si pasaron 4 segundos y el botón sigue diciendo "Verificando..." es que falló.
    if (submitBtn.disabled && submitBtn.innerHTML.includes('Verificando')) {
        const hash = window.location.hash;
        if (!hash || hash.length < 10) {
             showError('Error: El enlace está roto o incompleto. Revisa las "Redirect URLs" en Supabase.');
        } else {
             showError('El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.');
        }
    }
}, 4000);