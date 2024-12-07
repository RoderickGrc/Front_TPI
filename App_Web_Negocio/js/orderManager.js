// js/orderManager.js

document.addEventListener("DOMContentLoaded", async () => {

    // Verificar autenticación
    if (!isAuthenticated()) {
        window.location.href = './index.html';
        return;
    }

    // Referencias a elementos del DOM
    const foodItemsBody = document.getElementById("foodItemsBody");
    const categoriaFilter = document.getElementById("categoria-filter");
    const pedidoSection = document.querySelector(".pedido");
    const campoTotal = document.getElementById("campo-total");
    const addToCartButton = document.getElementById("add-to-cart");
    const finalizarCompraButton = document.getElementById("finalizar-compra");
    const customerForm = document.getElementById("customerForm");
    const ordersTableBody = document.querySelector("#ordersTableBody");

    let carrito = [];
    let allItems = [];

    // Función para cargar items de comida desde la API
    async function loadFoodItems() {
        try {
            const items = await apiRequest('/menu_manager/getActiveFoodItems/', 'GET', null, true);
            allItems = items; // Guardar para filtrar si es necesario
            renderFoodItems(allItems);
            fillCategoriaFilter(allItems);
        } catch (error) {
            console.error('Error al cargar items:', error);
            Swal.fire('Error', 'No se pudieron cargar los items.', 'error');
        }
    }

    // Llenar el filtro de categorías
    function fillCategoriaFilter(items) {
        const categorias = new Set(['all']);
        items.forEach(item => categorias.add(item.category));
        categoriaFilter.innerHTML = '';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = capitalizeFirstLetter(cat);
            categoriaFilter.appendChild(option);
        });
    }

    // Función para capitalizar la primera letra
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Renderizar items de comida en la tabla
    function renderFoodItems(items) {
        foodItemsBody.innerHTML = '';
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${capitalizeFirstLetter(item.category)}</td>
                <td>${item.name}</td>
                <td>${item.description}</td>
                <td>$${parseFloat(item.unitPrice).toFixed(2)}</td>
                <td><img src="${item.image ? item.image : './images/default.png'}" alt="${item.name}" class="img-thumbnail" style="width:60px; height:60px;" loading="lazy"></td>
                <td>
                    <div class="quantity-container">
                        <button class="btn btn-sm btn-secondary decrease" aria-label="Disminuir Cantidad">-</button>
                        <span class="quantity-number-table">0</span>
                        <button class="btn btn-sm btn-secondary increase" aria-label="Aumentar Cantidad">+</button>
                    </div>
                </td>
            `;
            // Guardar el id en un data-attribute para referencia
            tr.dataset.foodId = item.id;
            foodItemsBody.appendChild(tr);
        });
    }

    // Delegación de eventos para aumentar/disminuir cantidades en la tabla de productos
    foodItemsBody.addEventListener('click', (event) => {
        if (event.target.classList.contains("decrease")) {
            const quantityElement = event.target.parentElement.querySelector(".quantity-number-table");
            let quantity = parseInt(quantityElement.textContent, 10) || 0;
            if (quantity > 0) {
                quantityElement.textContent = quantity - 1;
            }
        } else if (event.target.classList.contains("increase")) {
            const quantityElement = event.target.parentElement.querySelector(".quantity-number-table");
            let quantity = parseInt(quantityElement.textContent, 10) || 0;
            quantityElement.textContent = quantity + 1;
        }
    });

    // Filtrar items por categoría
    categoriaFilter.addEventListener('change', () => {
        const selectedCat = categoriaFilter.value;
        if (selectedCat === 'all') {
            renderFoodItems(allItems);
        } else {
            const filtered = allItems.filter(i => i.category === selectedCat);
            renderFoodItems(filtered);
        }
    });

    // Añadir pedido (crear carrito)
    addToCartButton.addEventListener("click", () => {
        const rows = foodItemsBody.querySelectorAll("tr");
        pedidoSection.innerHTML = `<h5 class="fw-bold mb-3">Pedido</h5>`;
        carrito = []; // Reiniciar carrito

        rows.forEach(row => {
            const quantity = parseInt(row.querySelector(".quantity-number-table").textContent, 10) || 0;
            if (quantity > 0) {
                const name = row.children[1].textContent;
                const price = parseFloat(row.children[3].textContent.replace("$", ""));
                const imageSrc = row.querySelector("img").src;
                const foodId = parseInt(row.dataset.foodId, 10);

                carrito.push({ foodId, name, price, quantity, imageSrc });

                const pedidoItem = `
                    <div class="d-flex align-items-center mb-3 p-3 card-producto position-relative border rounded">
                        <img src="${imageSrc}" alt="${name}" class="img-producto me-3" style="width:60px; height:60px;">
                        <section>
                            <p class="mb-1 fw-bold">${name}</p>
                            <p class="mb-0 text-muted">x${quantity}</p>
                        </section>
                        <p class="ms-auto mb-0 fw-bold">$${(price * quantity).toFixed(2)}</p>
                    </div>
                `;
                pedidoSection.innerHTML += pedidoItem;
            }

            // Resetear cantidad en la tabla
            row.querySelector(".quantity-number-table").textContent = '0';
        });

        limpiarFormulario();
        actualizarTotal();
    });

    // Función para limpiar el formulario de datos del cliente
    function limpiarFormulario() {
        customerForm.reset();
    }

    // Actualizar el total del pedido
    function actualizarTotal() {
        let total = carrito.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        campoTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Finalizar compra (crear pedido en el backend)
    finalizarCompraButton.addEventListener("click", async () => {
        if (carrito.length === 0) {
            Swal.fire('Atención', 'No hay elementos en el pedido.', 'warning');
            return;
        }

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const address = document.getElementById("address").value.trim();

        if (!name || !email || !phone || !address) {
            Swal.fire('Error', 'Completa todos los campos del formulario.', 'error');
            return;
        }

        // Construir objeto para createOrder
        // food_items: array de objetos {food_item_id: id, quantity: q}
        const food_items = carrito.map(c => ({ food_item_id: c.foodId, quantity: c.quantity }));
        const description = "Pedido en línea";

        const newOrder = {
            address: address,
            description: description,
            food_items: food_items,
            customer_name: name,
            customer_email: email,
            customer_phone: phone
        };

        // Imprimir el cuerpo de la solicitud en la consola para depuración
        console.log('Cuerpo de la solicitud para crear pedido:', JSON.stringify(newOrder, null, 2));

        try {
            const response = await apiRequest('/order_manager/createOrder/', 'POST', newOrder, true);
            console.log('Respuesta del backend al crear pedido:', response);
            Swal.fire('Éxito', 'Pedido creado exitosamente.', 'success');
            carrito = [];
            pedidoSection.innerHTML = `<h5 class="fw-bold mb-3">Pedido</h5>`;
            campoTotal.textContent = `$0.00`;
            limpiarFormulario();
            loadOrders(); // Recargar lista de pedidos
        } catch (error) {
            console.error('Error al crear el pedido:', error);
            Swal.fire('Error', error.message || 'No se pudo crear el pedido.', 'error');
        }
    });

    // Cargar y mostrar pedidos existentes (Read)
    async function loadOrders() {
        try {
            const response = await apiRequest('/order_manager/viewAllOrders/', 'GET', null, true);
            ordersTableBody.innerHTML = '';
            if (response && response.results) {
                response.results.forEach(order => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${order.id}</td>
                        <td>${order.customer_name || 'N/A'}</td>
                        <td>${order.address}</td>
                        <td>${capitalizeFirstLetter(order.status)}</td>
                        <td>
                            <button class="btn btn-danger btn-sm btn-delete-order" data-order-id="${order.id}">Eliminar</button>
                        </td>
                    `;
                    ordersTableBody.appendChild(tr);
                });
            } else {
                console.warn('No hay resultados en la respuesta.');
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            Swal.fire('Error', 'No se pudieron cargar los pedidos.', 'error');
        }
    }

    // Eliminar pedido (Delete)
    ordersTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-delete-order')) {
            const orderId = event.target.getAttribute('data-order-id');
            Swal.fire({
                title: '¿Estás seguro?',
                text: `¿Deseas eliminar el pedido con ID ${orderId}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await apiRequest(`/order_manager/deleteOrder/${orderId}/`, 'DELETE', null, true);
                        Swal.fire('Eliminado', 'El pedido ha sido eliminado exitosamente.', 'success');
                        loadOrders();
                    } catch (error) {
                        console.error('Error al eliminar el pedido:', error);
                        Swal.fire('Error', error.message || 'No se pudo eliminar el pedido.', 'error');
                    }
                }
            });
        }
    });

    // Cargar datos iniciales
    await loadFoodItems();
    await loadOrders();
});
