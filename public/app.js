const SUPABASE_URL = 'https://wboxzvxjaowfmtauadjk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indib3h6dnhqYW93Zm10YXVhZGprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMTU2MjQsImV4cCI6MjA4MDg5MTYyNH0.mZhz3fR5drR3zONusA11p0i1CPYjIX717s66XHcFW9I';

// Inicializar el cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorDiv = document.getElementById('error');
  const successDiv = document.getElementById('success');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');

  // Limpiar mensajes
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  // Validaciones básicas
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

  // UI: Cargando...
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline-block';

  try {
    // MAGIA DE SUPABASE: Esta función detecta automáticamente la sesión
    // recuperada del enlace del correo y actualiza el usuario.
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) throw error;

    // Éxito
    successDiv.textContent = '¡Contraseña actualizada exitosamente!';
    successDiv.style.display = 'block';
    document.getElementById('resetForm').reset();
    
    // Opcional: Cerrar ventana después de 3 segundos
    setTimeout(() => {
        // window.close() a veces es bloqueado por navegadores, 
        // pero podemos intentarlo o mostrar mensaje final.
    }, 3000);

  } catch (error) {
    console.error(error);
    errorDiv.textContent = error.message || 'Error al actualizar contraseña. El enlace puede haber expirado.';
    errorDiv.style.display = 'block';
  } finally {
    // Restaurar botón
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
});

// Detectar sesión al cargar (Opcional, para debug)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    console.log('Modo recuperación detectado, listo para actualizar.');
  }
});
