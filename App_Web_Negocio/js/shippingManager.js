// js/shippingManager.js

document.addEventListener("DOMContentLoaded", async () => {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.location.href = './index.html';
        return;
    }

    const ordersSection = document.getElementById('ordersSection');

    // Función para cargar las órdenes desde el backend
    async function loadOrders() {
        try {
            const response = await apiRequest('/order_manager/viewAllOrders/', 'GET', null, true);
            console.log('Órdenes obtenidas del backend:', response);

            if (response && response.results && response.results.length > 0) {
                renderOrders(response.results);
            } else {
                ordersSection.innerHTML = '<p class="text-center mt-5">No hay órdenes disponibles.</p>';
            }

        } catch (error) {
            console.error('Error al cargar órdenes:', error);
            Swal.fire('Error', 'No se pudieron cargar las órdenes.', 'error');
        }
    }

    // Función para renderizar las órdenes en el HTML
    function renderOrders(orders) {
        ordersSection.innerHTML = '';
        orders.forEach(order => {
            const { id, customer_name, address, food_items, status } = order;

            // Construir la tabla de items
            let itemsHTML = '';
            food_items.forEach(item => {
                const category = 'N/A'; // No se proporciona categoría en la respuesta
                const name = item.food_item_name;
                const description = item.food_item_description;
                const quantity = item.quantity;

                itemsHTML += `
                    <tr>
                        <td>${category}</td>
                        <td>${name}</td>
                        <td>${description}</td>
                        <td>${quantity}</td>
                    </tr>
                `;
            });

            // Determinar el nombre del cliente (si es null, mostrar N/A)
            const cliente = customer_name || 'N/A';
            const dir = address || 'N/A';

            // Crear el artículo del pedido
            const article = document.createElement('article');
            article.classList.add('order-card', 'mb-4', 'p-3', 'rounded-3', 'table-responsive');

            article.innerHTML = `
                <header class="d-flex justify-content-between mb-3">
                    <span><strong>Id:</strong> ${id}</span>
                    <span><strong>Cliente:</strong> ${cliente}</span>
                    <span><strong>Dirección:</strong> ${dir}</span>
                </header>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <footer class="d-flex justify-content-start gap-3 mt-3">
                    <label>
                        <input type="checkbox" name="order-accepted-${id}">
                        Orden aceptada
                    </label>
                    <label>
                        <input type="checkbox" name="order-preparing-${id}">
                        En preparación
                    </label>
                    <label>
                        <input type="checkbox" name="order-ready-${id}">
                        Orden lista
                    </label>
                </footer>
            `;

            ordersSection.appendChild(article);
        });
    }

    // Cargar las órdenes al iniciar
    await loadOrders();
});
