// TUS CREDENCIALES
const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const inputs = document.querySelectorAll('input');
const form = document.getElementById('resetForm');

// Bloquear inicio
submitBtn.disabled = true;
inputs.forEach(i => i.disabled = true);
submitBtn.innerHTML = '<span class="loader"></span> Verificando Token...';

function enableForm() {
    submitBtn.disabled = false;
    inputs.forEach(i => i.disabled = false);
    submitBtn.innerHTML = 'Restablecer Contraseña';
    errorDiv.style.display = 'none';
}

// Lógica Universal (Detecta Hash o Sesión)
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event);
    
    if (session) {
        // ¡Tenemos sesión! (Implicit Flow la recupera automáticamente del Hash #)
        enableForm();
    } else {
        // Si no hay sesión inmediata, revisamos si hay error en la URL
        const hash = window.location.hash;
        if (hash && hash.includes('error_description')) {
            const params = new URLSearchParams(hash.substring(1)); // Quitar el #
            errorDiv.textContent = decodeURIComponent(params.get('error_description'));
            errorDiv.style.display = 'block';
            submitBtn.innerHTML = "Enlace Expirado";
        }
    }
});

// Timeout de seguridad
setTimeout(() => {
    if (submitBtn.disabled) {
        // Si sigue bloqueado, es que no llegó el token #
        const hash = window.location.hash;
        if (!hash || hash.length < 10) {
            errorDiv.textContent = 'Error: El enlace no contiene un token válido. Revisa que "Implicit Flow" esté activo en Supabase Dashboard.';
        } else {
            errorDiv.textContent = 'El enlace ha expirado o es inválido.';
        }
        errorDiv.style.display = 'block';
        submitBtn.innerHTML = "Error de Enlace";
    }
}, 5000);

// Manejo del Envío
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Guardando...';

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Reintentar';
    } else {
        successDiv.textContent = '¡Listo! Contraseña actualizada.';
        successDiv.style.display = 'block';
        form.reset();
    }
});