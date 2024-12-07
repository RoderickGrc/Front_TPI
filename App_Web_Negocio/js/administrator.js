// App_Web_Negocio/js/administrator.js

document.addEventListener("DOMContentLoaded", function () {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        // Redirigir a index.html si no está autenticado
        window.location.href = './index.html';
        return;
    }

    // Referencias a elementos del DOM
    const usersTableBody = document.getElementById('usersTableBody');
    const nuevoRegistroForm = document.getElementById('nuevoRegistroForm');
    const editarRegistroForm = document.getElementById('editarRegistroForm');
    const modalEditarRegistro = new bootstrap.Modal(document.getElementById('modalEditarRegistro'));
    const modalNuevoRegistro = new bootstrap.Modal(document.getElementById('modalNuevoRegistro'));
    const btnLogout = document.getElementById('btnLogout');

    // Función para cargar y mostrar todos los usuarios manejando la paginación
    async function loadUsers() {
        try {
            let allUsers = [];
            let url = '/administrator/getUsers/';
            // Asumiendo que 'apiRequest' usa el 'BASE_URL' internamente
            while (url) {
                const response = await apiRequest(url, 'GET', null, true);
                allUsers = allUsers.concat(response.results);
                // Extraer la ruta relativa para la siguiente página
                if (response.next) {
                    const nextUrl = new URL(response.next);
                    url = nextUrl.pathname + nextUrl.search;
                } else {
                    url = null;
                }
            }

            usersTableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

            allUsers.forEach(user => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>${formatRole(user.role)}</td>
                    <td>${user.email}</td>
                    <td>
                        <button class="btn btn-warning btn-sm btn-editar" data-user-id="${user.id}">Editar</button>
                        <button class="btn btn-danger btn-sm btn-eliminar" data-user-id="${user.id}">Eliminar</button>
                    </td>
                `;

                usersTableBody.appendChild(tr);
            });

            // Asignar eventos a los nuevos botones
            assignActionButtons();
        } catch (error) {
            console.error('Error al cargar los usuarios:', error);
            Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
        }
    }

    // Función para formatear el rol a un nombre legible
    function formatRole(role) {
        switch(role) {
            case 'administrator':
                return 'Administrator';
            case 'menu_manager':
                return 'Menu Manager';
            case 'order_manager':
                return 'Order Manager';
            case 'shipping_manager':
                return 'Dispatcher';
            default:
                return role;
        }
    }

    // Función para asignar eventos a los botones de editar y eliminar
    function assignActionButtons() {
        // Botones de editar
        const editButtons = document.querySelectorAll('.btn-editar');
        editButtons.forEach(button => {
            button.addEventListener('click', function () {
                const userId = this.getAttribute('data-user-id');
                openEditModal(userId);
            });
        });

        // Botones de eliminar
        const deleteButtons = document.querySelectorAll('.btn-eliminar');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const userId = this.getAttribute('data-user-id');
                confirmDeleteUser(userId);
            });
        });
    }

    // Función para abrir el modal de edición y cargar los datos del usuario
    async function openEditModal(userId) {
        try {
            const user = await apiRequest(`/administrator/getUserById/${userId}/`, 'GET', null, true);
            
            // Rellenar el formulario con los datos del usuario
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editFirstName').value = user.first_name || '';
            document.getElementById('editLastName').value = user.last_name || '';
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editRole').value = user.role;

            // Limpiar el campo de contraseña
            document.getElementById('editPassword').value = '';

            // Abrir el modal
            modalEditarRegistro.show();
        } catch (error) {
            console.error('Error al obtener los datos del usuario:', error);
            Swal.fire('Error', 'No se pudieron obtener los datos del usuario.', 'error');
        }
    }

// Función para confirmar y eliminar un usuario
async function confirmDeleteUser(userId) {
    try {
        // Obtener los datos del usuario a eliminar
        const user = await apiRequest(`/administrator/getUserById/${userId}/`, 'GET', null, true);
        const { username, email, role } = user;

        // Mostrar confirmación
        Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar al usuario "${username}" (${email})?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Crear el objeto con los datos necesarios para eliminar
                    const deleteData = {
                        username: username,
                        email: email,
                        role: role
                    };

                    // Enviar la solicitud POST para eliminar el usuario
                    await apiRequest('/administrator/deleteUser/', 'POST', deleteData, true);

                    // Mostrar mensaje de éxito
                    Swal.fire('Eliminado', 'El usuario ha sido eliminado exitosamente.', 'success');

                    // Recargar la lista de usuarios
                    loadUsers();
                } catch (error) {
                    console.error('Error al eliminar el usuario:', error);
                    Swal.fire('Error', error.message || 'No se pudo eliminar el usuario.', 'error');
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener los datos del usuario para eliminar:', error);
        Swal.fire('Error', 'No se pudieron obtener los datos del usuario.', 'error');
    }
}


    // Manejar el envío del formulario de nuevo registro
    nuevoRegistroForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const username = document.getElementById('newUsername').value.trim();
        const firstName = document.getElementById('newFirstName').value.trim();
        const lastName = document.getElementById('newLastName').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        // Validar los campos
        if (!username || !firstName || !lastName || !email || !password || !role) {
            Swal.fire('Error', 'Por favor, completa todos los campos.', 'warning');
            return;
        }

        // Crear el objeto de usuario
        const newUser = {
            username: username,
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
            role: role
        };

        try {
            // Enviar la solicitud para crear el usuario
            await apiRequest('/auth/register/', 'POST', newUser, false);
            Swal.fire('Éxito', 'Usuario creado exitosamente.', 'success');
            nuevoRegistroForm.reset();
            modalNuevoRegistro.hide();
            loadUsers(); // Recargar la lista de usuarios
        } catch (error) {
            console.error('Error al crear el usuario:', error);
            Swal.fire('Error', error.message || 'No se pudo crear el usuario.', 'error');
        }
    });

    // Manejar el envío del formulario de edición
    editarRegistroForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Obtener los valores del formulario
        const userId = document.getElementById('editUserId').value;
        const username = document.getElementById('editUsername').value.trim();
        const firstName = document.getElementById('editFirstName').value.trim();
        const lastName = document.getElementById('editLastName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const password = document.getElementById('editPassword').value;
        const role = document.getElementById('editRole').value;

        // Validar los campos
        if (!username || !firstName || !lastName || !email || !role) {
            Swal.fire('Error', 'Por favor, completa todos los campos obligatorios.', 'warning');
            return;
        }

        // Crear el objeto de actualización
        const updatedUser = {
            username: username,
            first_name: firstName,
            last_name: lastName,
            email: email,
            role: role
        };

        // Incluir la contraseña solo si se ha proporcionado
        if (password) {
            updatedUser.password = password;
        }

        try {
            // Enviar la solicitud para actualizar el usuario
            await apiRequest(`/administrator/editUserById/${userId}/`, 'PUT', updatedUser, true);
            Swal.fire('Éxito', 'Usuario actualizado exitosamente.', 'success');
            editarRegistroForm.reset();
            modalEditarRegistro.hide();
            loadUsers(); // Recargar la lista de usuarios
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
            Swal.fire('Error', error.message || 'No se pudo actualizar el usuario.', 'error');
        }
    });

    // Manejar el clic en el botón de cierre de sesión
    btnLogout.addEventListener('click', function () {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Cerrarás tu sesión actual.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                logout(); // Eliminar el token
                Swal.fire(
                    'Sesión Cerrada',
                    'Has cerrado sesión exitosamente.',
                    'success'
                ).then(() => {
                    window.location.href = './index.html'; // Redirigir al inicio
                });
            }
        });
    });

    // Función para cargar y mostrar todos los usuarios al iniciar la página
    loadUsers();
});
