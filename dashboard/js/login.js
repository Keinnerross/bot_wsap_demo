window.onload = () => {
  const socket = io();  // URL del servidor (ajusta si es necesario)

  // Cuando se envíe el formulario de login, evitar el comportamiento por defecto
  document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();

    // Obtener los valores de los campos
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Emitir el evento de login al servidor con los datos del formulario
    socket.emit('login', { username, password });
  });

  // Escuchar las respuestas del servidor para el login
  socket.on('login-success', (data) => {
    // Usar SweetAlert2 para mostrar el mensaje de éxito
    Swal.fire({
      icon: 'success',
      title: 'Login Successful',
      text: data.message,
      confirmButtonText: 'OK'
    });

    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'block';
  });

  socket.on('login-error', (data) => {
    // Usar SweetAlert2 para mostrar el mensaje de error
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: data.message,
      confirmButtonText: 'Try Again'
    });
  });

  // Comprobar si el usuario está autenticado al cargar la página
  socket.emit('check-auth');

  socket.on('auth-status', (data) => {
    if (data.authenticated) {
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('dashboardContainer').style.display = 'flex';
    } else {
      document.getElementById('loginContainer').style.display = 'flex';
      document.getElementById('dashboardContainer').style.display = 'none';
    }
  });
};
