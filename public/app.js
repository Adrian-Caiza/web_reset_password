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
submitBtn.innerHTML = '<span class="loader"></span> Analizando enlace...';

function showError(msg) {
    errorDiv.innerHTML = msg; // Usamos innerHTML para permitir saltos de línea
    errorDiv.style.display = 'block';
    submitBtn.innerHTML = 'Error Fatal';
    submitBtn.disabled = true;
}

function enableForm() {
    submitBtn.disabled = false;
    inputs.forEach(i => i.disabled = false);
    submitBtn.innerHTML = 'Restablecer Contraseña';
    errorDiv.style.display = 'none';
}

// 2. FUNCIÓN DE DIAGNÓSTICO E INICIO
async function init() {
    console.log("Iniciando diagnóstico...");
    
    // Verificar si hay sesión existente primero
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error("Error de sesión:", sessionError);
        showError(`Error obteniendo sesión: <br/> ${sessionError.message}`);
        return;
    }

    if (session) {
        console.log("¡Sesión detectada!", session.user.email);
        enableForm();
        return;
    }

    // Si no hay sesión, miramos la URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorDescription = params.get('error_description');

    if (errorDescription) {
        // Supabase ya nos mandó un error en la URL
        showError(`Supabase reporta error: <br/> ${errorDescription}`);
        return;
    }

    if (code) {
        console.log("Código PKCE detectado, esperando intercambio...");
        // A veces el getSession tarda un poco en procesar el código.
        // Esperamos el evento de cambio de estado.
    } else {
        // Chequeo de hash (método antiguo)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            console.log("Hash detectado, intentando recuperar...");
        } else {
            showError('No se encontró ningún código de seguridad en el enlace.<br>Asegúrate de copiar el enlace completo.');
        }
    }
}

// 3. LISTENER DE EVENTOS (Aquí ocurre la magia)
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event);
    if (session) {
        enableForm();
    } else if (event === 'SIGNED_OUT') {
        // A veces pasa esto si el token es inválido
        const params = new URLSearchParams(window.location.search);
        if (params.get('code')) {
             // Si hay código pero nos deslogueó, es que falló el intercambio
             // Intentamos ver si hay un error en la consola o forzamos un mensaje
             setTimeout(() => {
                 if(submitBtn.disabled) showError('Error: El código ha expirado o ya fue usado. <br>SOLUCIÓN: Pide un nuevo correo y NO hagas clic. Copia y pega el link.');
             }, 3000);
        }
    }
});

// Ejecutar inicio
init();

// 4. MANEJAR EL ENVÍO (Igual que antes)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) return showError('Las contraseñas no coinciden');
    
    submitBtn.innerHTML = 'Guardando...';
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
        showError(error.message);
        submitBtn.innerHTML = 'Reintentar';
    } else {
        successDiv.textContent = '¡Contraseña actualizada!';
        successDiv.style.display = 'block';
        form.reset();
    }
});