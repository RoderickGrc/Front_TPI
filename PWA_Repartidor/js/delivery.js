// delivery.js

document.addEventListener('DOMContentLoaded', async () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const notificationIcon = document.getElementById('notificationIcon');
  const notificationCount = document.getElementById('notificationCount');
  const pedidosDisponiblesBtn = document.getElementById('pedidosDisponiblesBtn');
  const pedidoAsignadoBtn = document.getElementById('pedidoAsignadoBtn');
  const ordersTableBody = document.getElementById('ordersTableBody');
  const statusSwitch = document.getElementById('statusSwitch');
  const iniciarSesionForm = document.getElementById('iniciarSesionForm');
  const confirmarEntregaBtn = document.getElementById('confirmarEntregaBtn');

  const modalIdOrden = document.getElementById('modalIdOrden');
  const modalNombreCliente = document.getElementById('modalNombreCliente');
  const modalDireccion = document.getElementById('modalDireccion');
  const modalNumeroCelular = document.getElementById('modalNumeroCelular');

  let assignedOrder = null; // Pedido asignado actual

  // Verificar estado de autenticación al cargar
  if (isAuthenticated()) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';

      // Si ya está autenticado, cargar pedidos inmediatamente
      await cargarPedidos();
  } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
  }

  // Evento de inicio de sesión
  iniciarSesionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      try {
          await login(username, password);
          if (isAuthenticated()) {
              // Éxito al iniciar sesión
              loginBtn.style.display = 'none';
              logoutBtn.style.display = 'inline-block';

              // Cerrar modal de inicio de sesión
              const loginModal = new bootstrap.Modal(document.getElementById('modalIniciarSesion'));
              loginModal.hide();

              // Refrescar la página para cargar los pedidos
              window.location.reload();
          } else {
              alert('Error en el inicio de sesión. Por favor, intenta nuevamente.');
          }
      } catch (error) {
          alert(`Error: ${error.message}`);
      }
  });

  // Cerrar sesión
  logoutBtn.addEventListener('click', () => {
      logout();
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      assignedOrder = null;
      ordersTableBody.innerHTML = '';
      notificationIcon.style.display = 'none';
      notificationCount.textContent = '0';
  });

  // Cambio de estado online/offline
  statusSwitch.addEventListener('change', async () => {
      if (!isAuthenticated()) {
          statusSwitch.checked = false;
          alert("Debe iniciar sesión para cambiar estado.");
          return;
      }
      const isOnline = statusSwitch.checked ? 1 : 0;
      try {
          await apiRequest(`/delivery_person/changeIsOnline/0/`, 'POST', { is_online: isOnline }, true);
          console.log('Estado is_online actualizado:', isOnline);
      } catch (error) {
          console.error('Error al cambiar estado online:', error);
          alert('Error al cambiar estado. Intenta nuevamente.');
      }
  });

  // Cargar pedidos disponibles al hacer clic
  pedidosDisponiblesBtn.addEventListener('click', async () => {
      await cargarPedidos();
  });

  // Mostrar modal de pedido asignado
  pedidoAsignadoBtn.addEventListener('click', () => {
      if (assignedOrder) {
          modalIdOrden.value = assignedOrder.id;
          modalNombreCliente.value = assignedOrder.customer_name || '';
          modalDireccion.value = assignedOrder.address || '';
          modalNumeroCelular.value = assignedOrder.customer_phone || '';
      } else {
          alert('No hay pedido asignado actualmente.');
      }
  });

  // Confirmar entrega
  confirmarEntregaBtn.addEventListener('click', async () => {
      if (!assignedOrder) {
          alert('No hay pedido asignado.');
          return;
      }
      try {
          await apiRequest(`/delivery_person/changeOrderStatus/${assignedOrder.id}/`, 'POST', { status: "Entregado" }, true);
          alert('Entrega confirmada.');
          assignedOrder = null;
          notificationIcon.style.display = 'none';
          notificationCount.textContent = '0';
          await cargarPedidos();
          const modalAsignado = bootstrap.Modal.getInstance(document.getElementById('pedidoAsignadoModal'));
          modalAsignado.hide();
      } catch (error) {
          console.error('Error al confirmar entrega:', error);
          alert('No se pudo confirmar la entrega.');
      }
  });

  async function cargarPedidos() {
      if (!isAuthenticated()) {
          alert('Debe iniciar sesión para ver pedidos.');
          return;
      }
      try {
          // Usar el endpoint especificado
          const response = await apiRequest('/order_manager/viewAllOrders/', 'GET', null, true);
          const pedidos = response.results; // Extraer los pedidos de la propiedad "results"
          mostrarPedidosEnTabla(pedidos);

          // Verificar si hay pedido asignado/pendiente
          const pedidoPendiente = pedidos.find(p => p.status === "Pendiente" || p.status === "InDelivery");
          if (pedidoPendiente) {
              assignedOrder = pedidoPendiente;
              notificationIcon.style.display = 'inline-block';
              notificationCount.textContent = '1';
          } else {
              assignedOrder = null;
              notificationIcon.style.display = 'none';
              notificationCount.textContent = '0';
          }
      } catch (error) {
          console.error('Error al cargar pedidos:', error);
          alert('No se pudieron cargar los pedidos.');
      }
  }

  function mostrarPedidosEnTabla(pedidos) {
      ordersTableBody.innerHTML = '';
      if (!pedidos || pedidos.length === 0) {
          ordersTableBody.innerHTML = '<tr><td colspan="4">No hay pedidos disponibles.</td></tr>';
          return;
      }

      pedidos.forEach(pedido => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
              <td>${pedido.id}</td>
              <td>${pedido.customer_name || ''}</td>
              <td>${pedido.address || ''}</td>
              <td>${pedido.customer_phone || ''}</td>
          `;
          ordersTableBody.appendChild(tr);
      });
  }
})();
