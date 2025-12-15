// TUS CREDENCIALES
const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const inputs = document.querySelectorAll('input');
const form = document.getElementById('resetForm');

// 1. BLOQUEAR AL INICIO
submitBtn.disabled = true;
inputs.forEach(i => i.disabled = true);
submitBtn.innerHTML = '<span class="loader"></span> Verificando...';

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    submitBtn.innerHTML = 'Error de Enlace';
    submitBtn.disabled = true;
}

// 2. ESCUCHAR SESIÓN (Funciona con Hash # y con Query Params ?)
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event);
    
    if (session) {
        // ¡Éxito! Sesión recuperada
        submitBtn.disabled = false;
        inputs.forEach(i => i.disabled = false);
        submitBtn.innerHTML = 'Restablecer Contraseña';
        errorDiv.style.display = 'none';
    }
});

// 3. ENVÍO DEL FORMULARIO
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
        errorDiv.textContent = 'Mínimo 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Guardando...';

    try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        
        successDiv.textContent = '¡Contraseña actualizada!';
        successDiv.style.display = 'block';
        form.reset();
    } catch (err) {
        console.error(err);
        errorDiv.textContent = err.message || 'Error al actualizar.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Reintentar';
    }
});

// 4. DIAGNÓSTICO MEJORADO (Espera 6 segundos y revisa todo)
setTimeout(() => {
    // Solo si sigue bloqueado (significa que onAuthStateChange no se disparó)
    if (submitBtn.disabled && submitBtn.innerHTML.includes('Verificando')) {
        
        const hash = window.location.hash;   // Token viejo (#access_token)
        const search = window.location.search; // Código nuevo (?code=)

        if (!hash && !search) {
              showError('Error Crítico: El enlace llegó limpio (sin token ni código). Supabase limpió la URL. Verifica las Redirect URLs.');
        } else if (search) {
             // Si hay ?code= pero no hay sesión, es que el código expiró o supabase-js falló
              showError('Detectado código PKCE, pero expiró o es inválido. Solicita un NUEVO correo (no reuses el anterior).');
        } else {
              showError('El enlace ha expirado. Solicita uno nuevo.');
        }
        
        // Imprimir en consola para debug
        console.log("Hash:", hash);
        console.log("Search:", search);
    }
}, 6000); // Aumentamos a 6 segundos para dar tiempo en móviles