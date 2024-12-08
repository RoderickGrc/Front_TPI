// App_Web_Negocio/js/registro.js

document.addEventListener("DOMContentLoaded", function () {
    const registroForm = document.getElementById('registroForm');

    registroForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validar los campos
        if (!nombre || !apellido || !username || !email || !password || !confirmPassword) {
            Swal.fire('Error', 'Por favor, completa todos los campos.', 'warning');
            return;
        }

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden.', 'warning');
            return;
        }

        // Opcional: Validar la fortaleza de la contraseña
        if (password.length < 6) {
            Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres.', 'warning');
            return;
        }

        // Crear el objeto de usuario con rol "customer"
        const newUser = {
            first_name: nombre,
            last_name: apellido,
            username: username,
            email: email,
            password: password,
            role: "customer" // Asignación automática del rol
        };

        try {
            // Enviar la solicitud para crear el usuario
            await apiRequest('/auth/register/', 'POST', newUser, false);
            Swal.fire({
                title: 'Éxito',
                text: 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.',
                icon: 'success',
                confirmButtonText: 'Iniciar Sesión'
            }).then(() => {
                // Redirigir al usuario a la página de inicio de sesión
                window.location.href = './login.html'; // Ajusta la ruta según tu estructura
            });
        } catch (error) {
            console.error('Error al crear el usuario:', error);
            // Manejar errores específicos basados en la respuesta de la API
            if (error.message.includes('username')) {
                Swal.fire('Error', 'El nombre de usuario ya está en uso. Por favor, elige otro.', 'error');
            } else if (error.message.includes('email')) {
                Swal.fire('Error', 'El correo electrónico ya está registrado. Por favor, usa otro.', 'error');
            } else {
                Swal.fire('Error', error.message || 'No se pudo crear la cuenta. Por favor, intenta nuevamente.', 'error');
            }
        }
    });
});
