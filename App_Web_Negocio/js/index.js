// App_Web_Negocio/js/index.js

document.addEventListener('DOMContentLoaded', () => {
    // Obtener referencias a los elementos del DOM
    const formLogin = document.getElementById('iniciarSesion');
    const btnAdministrator = document.getElementById('btnAdministrator');
    const btnMenuManager = document.getElementById('btnMenuManager');
    const btnOrderManager = document.getElementById('btnOrderManager');
    const btnDispatcher = document.getElementById('btnDispatcher');
    const loginModalElement = document.getElementById('modalIniciarSesion');
    const loginModal = new bootstrap.Modal(loginModalElement);

    // Manejar el envío del formulario de inicio de sesión
    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        try {
            const response = await login(username, password);
            if (isAuthenticated()) {
                alert('Inicio de sesión exitoso.');
                loginModal.hide();
                // Opcional: Actualizar la UI para mostrar estado de autenticación
                // Por ejemplo, cambiar los botones a opciones de cierre de sesión
            } else {
                alert('Error en el inicio de sesión. Por favor, intenta nuevamente.');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // Función para manejar clics en los botones de roles
    const handleRoleButtonClick = (role) => {
        if (isAuthenticated()) {
            switch(role) {
                case 'Administrator':
                    window.location.href = './administrator.html';
                    break;
                case 'Menu Manager':
                    window.location.href = './menuManager.html';
                    break;
                case 'Order Manager':
                    window.location.href = './orderManager.html';
                    break;
                case 'Dispatcher':
                    window.location.href = './shippingManager.html';
                    break;
                default:
                    console.error('Rol desconocido:', role);
            }
        } else {
            loginModal.show();
        }
    };

    // Asignar eventos de clic a los botones
    btnAdministrator.addEventListener('click', () => handleRoleButtonClick('Administrator'));
    btnMenuManager.addEventListener('click', () => handleRoleButtonClick('Menu Manager'));
    btnOrderManager.addEventListener('click', () => handleRoleButtonClick('Order Manager'));
    btnDispatcher.addEventListener('click', () => handleRoleButtonClick('Dispatcher'));
});
