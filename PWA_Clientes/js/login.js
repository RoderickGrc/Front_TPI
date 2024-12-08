// App_Web_Negocio/js/login.js

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Validar los campos
        if (!username || !password) {
            Swal.fire('Error', 'Por favor, completa todos los campos.', 'warning');
            return;
        }

        try {
            // Realizar el inicio de sesión utilizando la función login de auth.js
            const response = await login(username, password);
            
            // Verificar si la autenticación fue exitosa
            if (isAuthenticated()) {
                Swal.fire({
                    title: 'Éxito',
                    text: 'Inicio de sesión exitoso.',
                    icon: 'success',
                    confirmButtonText: 'Continuar'
                }).then(() => {
                    // Redirigir al usuario a la página principal o dashboard
                    window.location.href = './index.html'; // Ajusta la ruta según tu estructura
                });
            } else {
                Swal.fire('Error', 'Error en el inicio de sesión. Por favor, intenta nuevamente.', 'error');
            }
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            Swal.fire('Error', error.message || 'Error en el inicio de sesión.', 'error');
        }
    });
});
