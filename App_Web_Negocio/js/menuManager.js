// App_Web_Negocio/js/menuManager.js

document.addEventListener("DOMContentLoaded", function () {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.location.href = './index.html';
        return;
    }

    // Referencias a elementos del DOM
    const foodItemsTableBody = document.getElementById('foodItemsTableBody');
    const addItemForm = document.getElementById('addItemForm');
    const editItemForm = document.getElementById('editItemForm');
    const modalAgregarPlatillo = new bootstrap.Modal(document.getElementById('modalAgregarPlatillo'));
    const modalEditarPlatillo = new bootstrap.Modal(document.getElementById('modalEditarPlatillo'));
    const btnLogout = document.getElementById('btnLogout');

    // Cargar platillos al iniciar
    loadFoodItems();

    // Evento para agregar nuevo platillo
    addItemForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('addNombre').value.trim();
        const category = document.getElementById('addCategoria').value;
        const description = document.getElementById('addDescripcion').value.trim();
        const unitPrice = parseFloat(document.getElementById('addPrecio').value.trim());
        const stockRestaurant = parseInt(document.getElementById('addStock').value.trim(), 10);

        // Validar los campos
        if (!name || !category || !description || isNaN(unitPrice) || isNaN(stockRestaurant)) {
            Swal.fire('Error', 'Por favor, completa todos los campos correctamente.', 'warning');
            return;
        }

        const newItem = {
            name: name,
            category: category,
            description: description,
            unitPrice: unitPrice,
            stockRestaurant: stockRestaurant
            // Se omite el campo 'image' debido a problemas en el backend
        };

        try {
            await apiRequest('/menu_manager/add_food_item/', 'POST', newItem, true);
            Swal.fire('Éxito', 'Platillo agregado exitosamente.', 'success');
            addItemForm.reset();
            modalAgregarPlatillo.hide();
            loadFoodItems();
        } catch (error) {
            console.error('Error al agregar el platillo:', error);
            Swal.fire('Error', error.message || 'No se pudo agregar el platillo.', 'error');
        }
    });

    // Evento para actualizar un platillo
    editItemForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const itemId = document.getElementById('editItemId').value;
        const name = document.getElementById('editNombre').value.trim();
        const category = document.getElementById('editCategoria').value;
        const description = document.getElementById('editDescripcion').value.trim();
        const unitPrice = parseFloat(document.getElementById('editPrecio').value.trim());
        const stockRestaurant = parseInt(document.getElementById('editStock').value.trim(), 10);

        // Validar los campos
        if (!itemId || !name || !category || !description || isNaN(unitPrice) || isNaN(stockRestaurant)) {
            Swal.fire('Error', 'Por favor, completa todos los campos correctamente.', 'warning');
            return;
        }

        const updatedItem = {
            name: name,
            category: category,
            description: description,
            unitPrice: unitPrice,
            stockRestaurant: stockRestaurant
            // Se omite el campo 'image' debido a problemas en el backend
        };

        try {
            await apiRequest(`/menu_manager/editFoodItem/${itemId}/`, 'PUT', updatedItem, true);
            Swal.fire('Éxito', 'Platillo actualizado exitosamente.', 'success');
            editItemForm.reset();
            modalEditarPlatillo.hide();
            loadFoodItems();
        } catch (error) {
            console.error('Error al actualizar el platillo:', error);
            Swal.fire('Error', error.message || 'No se pudo actualizar el platillo.', 'error');
        }
    });

    // Función para cargar y mostrar todos los platillos
    async function loadFoodItems() {
        try {
            const response = await apiRequest('/menu_manager/getFoodItems/', 'GET', null, true);
            const allItems = response; // Asume que esta endpoint devuelve array de food items sin paginación
            foodItemsTableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

            allItems.forEach(item => {
                const tr = document.createElement('tr');
                const priceFormatted = `$${item.unitPrice.toFixed(2)}`;
                tr.innerHTML = `
                    <td>${capitalizeFirstLetter(item.category)}</td>
                    <td>${item.name}</td>
                    <td>${item.description}</td>
                    <td>${priceFormatted}</td>
                    <td>
                        <button class="btn btn-warning btn-sm btn-editar" data-item-id="${item.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-eliminar" data-item-id="${item.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-dark btn-sm btn-toggle-status" data-item-id="${item.id}" data-active="${item.isActive ? 'true' : 'false'}">
                            <i class="bi ${item.isActive ? 'bi-eye-fill' : 'bi-eye-slash-fill'}"></i>
                        </button>
                    </td>
                    <td>${item.stockRestaurant}</td>
                `;
                foodItemsTableBody.appendChild(tr);
            });

            assignActionButtons();
        } catch (error) {
            console.error('Error al cargar los platillos:', error);
            Swal.fire('Error', 'No se pudieron cargar los platillos.', 'error');
        }
    }

    // Función para asignar eventos a los botones de acción
    function assignActionButtons() {
        // Botones de Editar
        const editButtons = document.querySelectorAll('.btn-editar');
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-item-id');
                openEditModal(itemId);
            });
        });

        // Botones de Eliminar
        const deleteButtons = document.querySelectorAll('.btn-eliminar');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-item-id');
                confirmDeleteItem(itemId);
            });
        });

        // Botones de Cambiar Estado
        const toggleStatusButtons = document.querySelectorAll('.btn-toggle-status');
        toggleStatusButtons.forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-item-id');
                const currentActive = button.getAttribute('data-active') === 'true';
                confirmToggleStatus(itemId, currentActive);
            });
        });
    }

    // Función para abrir el modal de edición y cargar los datos del platillo
    async function openEditModal(itemId) {
        try {
            const item = await apiRequest(`/menu_manager/getFoodItemById/${itemId}/`, 'GET', null, true);
            document.getElementById('editItemId').value = item.id;
            document.getElementById('editNombre').value = item.name;
            document.getElementById('editCategoria').value = item.category;
            document.getElementById('editDescripcion').value = item.description;
            document.getElementById('editPrecio').value = item.unitPrice;
            document.getElementById('editStock').value = item.stockRestaurant;

            modalEditarPlatillo.show();
        } catch (error) {
            console.error('Error al obtener los datos del platillo:', error);
            Swal.fire('Error', 'No se pudieron obtener los datos del platillo.', 'error');
        }
    }

    // Función para confirmar y eliminar un platillo
    async function confirmDeleteItem(itemId) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiRequest(`/menu_manager/deleteFoodItem/${itemId}/`, 'DELETE', null, true);
                    Swal.fire('Eliminado', 'El platillo ha sido eliminado exitosamente.', 'success');
                    loadFoodItems();
                } catch (error) {
                    console.error('Error al eliminar el platillo:', error);
                    Swal.fire('Error', error.message || 'No se pudo eliminar el platillo.', 'error');
                }
            }
        });
    }

    // Función para confirmar y cambiar el estado activo/inactivo de un platillo
    async function confirmToggleStatus(itemId, currentActive) {
        const newStatus = !currentActive;
        const statusText = newStatus ? 'activar' : 'desactivar';

        Swal.fire({
            title: `¿Deseas ${statusText} este platillo?`,
            text: `El platillo será ${newStatus ? 'activo' : 'inactivo'}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#28a745' : '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Sí, ${statusText}`,
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const statusData = { isActive: newStatus };
                    await apiRequest(`/menu_manager/changeFoodItemStatus/${itemId}/`, 'POST', statusData, true);
                    Swal.fire('Éxito', `El platillo ha sido ${newStatus ? 'activado' : 'desactivado'} exitosamente.`, 'success');
                    loadFoodItems();
                } catch (error) {
                    console.error('Error al cambiar el estado del platillo:', error);
                    Swal.fire('Error', error.message || `No se pudo ${statusText} el platillo.`, 'error');
                }
            }
        });
    }

    // Función para capitalizar la primera letra de una palabra
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

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
});
