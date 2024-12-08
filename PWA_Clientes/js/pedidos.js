// pedidos.js

let allOrders = [];
const ordersTable = document.getElementById('ordersTable').querySelector('tbody');
const statusCombobox = document.querySelector('.combobox');

document.addEventListener("DOMContentLoaded", async () => {
    if (!isAuthenticated()) {
        window.location.href = './login.html';
        return;
    }

    await cargarPedidosDelUsuario();
    mostrarPedidosFiltrados(); // Mostrar todos inicialmente

    statusCombobox.addEventListener('change', () => {
        mostrarPedidosFiltrados();
    });
});

async function cargarPedidosDelUsuario() {
    try {
        const data = await apiRequest('/pedidos/listUserOrders/', 'GET', null, true);
        // data es un array con objetos { order_id, customer_id, username, first_name, last_name, email, phone, address, total_price, status }
        allOrders = data;
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        Swal.fire('Error', 'No se pudo cargar la lista de pedidos.', 'error');
        allOrders = [];
    }
}

function mostrarPedidosFiltrados() {
    const selectedStatus = statusCombobox.value; 
    let filteredOrders = allOrders;

    // Mapeo de estados: Combobox a API
    // in_delivery => "InDelivery"
    // pending => "Pendiente"
    // delivered => "Entregado"
    let estadoCorrespondencia = {
        "in_delivery": "InDelivery",
        "pending": "Pendiente",
        "delivered": "Entregado"
    };

    if (selectedStatus !== 'all') {
        const estadoBuscado = estadoCorrespondencia[selectedStatus];
        filteredOrders = allOrders.filter(o => o.status === estadoBuscado);
    }

    renderOrders(filteredOrders);
}

function renderOrders(orders) {
    ordersTable.innerHTML = "";

    if (orders.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6">No hay pedidos para mostrar.</td>`;
        ordersTable.appendChild(tr);
        return;
    }

// Dentro de la función renderOrders(orders) en pedidos.js

orders.forEach(order => {
    const fecha = "N/A"; 
    const idPedido = order.order_id;
    const total = `$${parseFloat(order.total_price).toFixed(2)}`;
    const direccion = order.address || 'N/A';
    const estado = order.status || 'N/A';

    // Cambiar el enlace de detalles para que apunte a verPedido.html con query param
    const detallesLink = `<a href="./verPedido.html?pedido_id=${idPedido}" class="btn btn-primary btn-sm">Ver Detalles</a>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${fecha}</td>
        <td>${idPedido}</td>
        <td>${total}</td>
        <td>${direccion}</td>
        <td>${estado}</td>
        <td>${detallesLink}</td>
    `;

    ordersTable.appendChild(tr);
});

}
