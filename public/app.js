const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const inputs = document.querySelectorAll('input');

// Función para mostrar errores en pantalla (útil para debug en móvil)
function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    submitBtn.innerHTML = 'Error de Sesión';
}

// Lógica Principal
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event); 
    
    // Si obtenemos sesión (sea por recuperación o login), desbloqueamos
    if (session) {
        submitBtn.disabled = false;
        inputs.forEach(i => i.disabled = false);
        submitBtn.innerHTML = 'Restablecer Contraseña';
        
        // Ocultar mensaje de error si había uno por timeout
        errorDiv.style.display = 'none';
    }
});

// Manejo del formulario (Igual que antes)
document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Guardando...';

    try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        
        successDiv.textContent = '¡Listo! Contraseña cambiada.';
        successDiv.style.display = 'block';
        document.getElementById('resetForm').reset();
    } catch (err) {
        showError(err.message);
    } finally {
        submitBtn.disabled = false;
        if(successDiv.style.display === 'none') submitBtn.innerHTML = 'Restablecer Contraseña';
    }
});

// Diagnóstico Visual en el celular
// Esto imprimirá la URL en la pantalla si falla, para que sepas qué está llegando mal.
setTimeout(() => {
    if (submitBtn.disabled) {
        const urlParams = window.location.hash || window.location.search;
        if (!urlParams) {
              showError('Error: El enlace llegó vacío (sin token). Revisa la configuración de redirección en Supabase.');
        } else {
             // Si hay params pero no hay sesión, supabase.js aun está procesando o falló
              console.log("Params detectados:", urlParams);
        }
    }
}, 5000);