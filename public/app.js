// TUS CREDENCIALES
const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

// Crear cliente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const submitBtn = document.getElementById('submitBtn');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');
const inputs = document.querySelectorAll('input');
const form = document.getElementById('resetForm');

// --- SISTEMA DE LOGS EN PANTALLA (Para ver errores en el celular) ---
// Creamos un área negra abajo para ver qué está pensando el código
const debugConsole = document.createElement('div');
debugConsole.style.cssText = "background: #000; color: #0f0; padding: 10px; margin-top: 20px; border-radius: 8px; font-family: monospace; font-size: 10px; white-space: pre-wrap; word-break: break-all;";
debugConsole.innerHTML = "--- CONSOLA DE DIAGNÓSTICO ---\n";
document.querySelector('.card').appendChild(debugConsole);

function log(msg) {
    console.log(msg);
    debugConsole.innerHTML += `> ${msg}\n`;
}

function errorLog(msg) {
    console.error(msg);
    debugConsole.innerHTML += `[ERROR] ${msg}\n`;
    debugConsole.style.border = "2px solid red";
}
// -------------------------------------------------------------------

// 1. BLOQUEAR AL INICIO
submitBtn.disabled = true;
inputs.forEach(i => i.disabled = true);
submitBtn.innerHTML = '<span class="loader"></span> Analizando...';

function enableForm() {
    log("¡ÉXITO! Sesión activa. Habilitando formulario.");
    submitBtn.disabled = false;
    inputs.forEach(i => i.disabled = false);
    submitBtn.innerHTML = 'Restablecer Contraseña';
    errorDiv.style.display = 'none';
    debugConsole.style.background = "#003300"; // Verde oscuro para celebrar
}

// 2. DIAGNÓSTICO PASO A PASO
async function init() {
    log("Iniciando script v4...");
    log("URL actual: " + window.location.href);

    // Ver qué parámetros llegaron
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const errorDesc = params.get('error_description');

    if (error) {
        errorLog(`Supabase devolvió error: ${error} - ${errorDesc}`);
        submitBtn.innerHTML = "Error detectado";
        return;
    }

    if (code) {
        log(`Código PKCE encontrado: ${code.substring(0, 5)}...`);
        log("Esperando intercambio de sesión...");
    } else {
        log("No hay parámetro '?code=' en la URL.");
        
        // Revisar Hash por si acaso (legacy)
        if(window.location.hash) {
             log("Hash detectado: " + window.location.hash.substring(0, 10) + "...");
        } else {
             errorLog("ALERTA: El enlace no tiene código ni token. ¿Redirect URL mal?");
        }
    }

    // Intentar obtener sesión
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            errorLog("Fallo en getSession: " + error.message);
        } else if (data.session) {
            log("Sesión encontrada en getSession direct.");
            enableForm();
        } else {
            log("getSession terminó sin error pero SIN sesión. Esperando evento...");
        }
    } catch (e) {
        errorLog("Excepción en init: " + e.message);
    }
}

// 3. ESCUCHAR EVENTOS
supabase.auth.onAuthStateChange((event, session) => {
    log(`Evento Auth disparado: ${event}`);
    if (session) {
        log("¡Sesión recibida en evento! Usuario: " + session.user.email);
        enableForm();
    } else {
        log("Evento recibido pero sin sesión.");
    }
});

// Timeout de seguridad (Si en 8 segs no pasa nada)
setTimeout(() => {
    if (submitBtn.disabled) {
        errorLog("TIEMPO AGOTADO. El script no recibió respuesta.");
        submitBtn.innerHTML = "Tiempo excedido";
        log("Intenta recargar la página o pedir nuevo link.");
    }
}, 8000);

init();

// 4. ENVÍO
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) return log("Error: Passwords no coinciden");

    submitBtn.innerHTML = 'Guardando...';
    log("Enviando nueva contraseña...");
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
        errorLog("Error al guardar: " + error.message);
        submitBtn.innerHTML = 'Reintentar';
    } else {
        log("¡TODO CORRECTO! Contraseña cambiada.");
        successDiv.textContent = '¡Contraseña actualizada!';
        successDiv.style.display = 'block';
        form.reset();
        setTimeout(() => window.close(), 3000);
    }
});