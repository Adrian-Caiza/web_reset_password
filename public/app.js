// TUS CREDENCIALES
const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias
const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const inputs = document.querySelectorAll('input');
const form = document.getElementById('resetForm');

// CONSOLA EN PANTALLA (Para ver qué pasa realmente)
const debugConsole = document.createElement('div');
debugConsole.style.cssText = "background: #000; color: #0f0; padding: 10px; margin-top: 20px; border-radius: 8px; font-family: monospace; font-size: 11px; white-space: pre-wrap;";
debugConsole.innerHTML = "--- CONSOLA DE DIAGNÓSTICO V5 (FORZADO) ---\n";
document.querySelector('.card').appendChild(debugConsole);

function log(msg) { debugConsole.innerHTML += `> ${msg}\n`; }
function errorLog(msg) { debugConsole.innerHTML += `[ERROR] ${msg}\n`; debugConsole.style.border = "2px solid red"; }

// Bloquear al inicio
submitBtn.disabled = true;
inputs.forEach(i => i.disabled = true);
submitBtn.innerHTML = 'Verificando Código...';

function enableForm() {
    submitBtn.disabled = false;
    inputs.forEach(i => i.disabled = false);
    submitBtn.innerHTML = 'Restablecer Contraseña';
    log("¡ACCESO CONCEDIDO! Formulario desbloqueado.");
    debugConsole.style.background = "#004400";
}

// LÓGICA DE INTERCAMBIO MANUAL
async function handleExchange() {
    log("Analizando URL...");
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
        errorLog("No hay código en la URL. ¿Enlace roto?");
        submitBtn.innerHTML = "Enlace Vacío";
        return;
    }

    log(`Código detectado: ${code.substring(0,6)}...`);
    log("Intentando intercambio manual de código...");

    // 1. INTENTO DE INTERCAMBIO OFICIAL
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        errorLog(`Fallo el intercambio: ${error.message}`);
        errorLog(`Nombre del error: ${error.name}`);
        
        // Si el error es PKCE, intentamos un truco sucio (Solo funciona en algunos configs)
        if (error.message.includes("verifier") || error.message.includes("PKCE")) {
             log("Detectado error de PKCE (Dispositivo cruzado).");
             log("Esto ocurre porque iniciaste en la App y terminaste en Web.");
        }
        submitBtn.innerHTML = "Error de Validación";
    } else if (data.session) {
        log("¡Intercambio exitoso! Sesión creada.");
        enableForm();
    } else {
        // A veces no da error pero no da sesión (raro en manual)
        // Intentamos ver si ya hay sesión global
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
            log("Sesión recuperada por otra vía.");
            enableForm();
        } else {
            errorLog("El servidor aceptó el código pero no devolvió sesión.");
        }
    }
}

// Ejecutar
handleExchange();

// ENVÍO
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) return log("Error: Passwords distintos");

    submitBtn.innerHTML = 'Guardando...';
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
        errorLog("Error al guardar: " + error.message);
        submitBtn.innerHTML = 'Reintentar';
    } else {
        successDiv.textContent = '¡Listo! Contraseña cambiada.';
        successDiv.style.display = 'block';
        form.reset();
    }
});
