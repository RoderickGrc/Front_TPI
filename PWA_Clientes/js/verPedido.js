// verPedido.js

document.addEventListener("DOMContentLoaded", async () => {
    if (!isAuthenticated()) {
      window.location.href = './login.html';
      return;
    }
  
    const pedidoId = obtenerParametroURL('pedido_id');
    if (!pedidoId) {
      Swal.fire('Error', 'No se ha proporcionado un ID de pedido.', 'error');
      return;
    }
  
    try {
      const pedido = await cargarPedido(pedidoId);
      mostrarPedido(pedido);
    } catch (error) {
      console.error('Error al cargar el pedido:', error);
      Swal.fire('Error', 'No se pudo cargar el pedido.', 'error');
    }
  });
  
  // Función para obtener parámetros de la URL
  function obtenerParametroURL(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre);
  }
  
  // Función para cargar los detalles del pedido desde el API
  async function cargarPedido(pedidoId) {
    // Endpoint: GET /pedidos/viewOrderUser/{pedido_id}/
    // Asegúrate de que el endpoint está protegido y requiere autenticación
    const data = await apiRequest(`/pedidos/viewOrderUser/${pedidoId}/`, 'GET', null, true);
    return data;
  }
  
  // Función para mostrar los detalles del pedido en la página
  function mostrarPedido(pedido) {
    // Rellenar los campos de facturación
    document.getElementById('idOrden').value = pedido.order_id || 'N/A';
    document.getElementById('nombreCliente').value = `${pedido.first_name || ''} ${pedido.last_name || ''}`.trim() || 'N/A';
    document.getElementById('direccion').value = pedido.address || 'N/A';
    document.getElementById('celular').value = pedido.phone || 'N/A';
    document.getElementById('estadoPedido').textContent = pedido.status || 'N/A';
  
    // Habilitar/Deshabilitar los checkboxes según el estado del pedido
    const entregaAceptada = document.getElementById('entregaAceptada');
    const enCamino = document.getElementById('enCamino');
    const entregado = document.getElementById('entregado');
  
    entregaAceptada.checked = pedido.status === 'Entrega aceptada' || pedido.status === 'InDelivery';
    enCamino.checked = pedido.status === 'En camino' || pedido.status === 'InDelivery';
    entregado.checked = pedido.status === 'Entregado';
  
    // Actualizar Envío (puedes ajustar según tu lógica)
    // Por ejemplo, si el envío es fijo, puedes asignarlo directamente
    const envio = 3.00; // Supongamos un envío fijo
    document.getElementById('envio').textContent = `$${envio.toFixed(2)}`;
  
    // Calcular Subtotal, Descuentos y Total
    let subtotal = 0;
    const carritoContenido = document.getElementById('carrito-contenido');
    carritoContenido.innerHTML = ''; // Limpiar contenido previo
  
    if (pedido.food_items && pedido.food_items.length > 0) {
      pedido.food_items.forEach(item => {
        const totalPrecio = parseFloat(item.food_item_price) * parseInt(item.quantity, 10);
        subtotal += totalPrecio;
  
        const productoHTML = document.createElement('article');
        productoHTML.classList.add("d-flex", "justify-content-between", "align-items-center", "border-bottom", "py-2", "color-productos");
        productoHTML.innerHTML = `
          <div class="d-flex align-items-center">
            <div>
              <p class="mb-1 fw-bold">${item.food_item_name}</p>
              <p class="mb-0 text-muted">x${item.quantity}</p>
            </div>
          </div>
          <p class="mb-0 fw-bold">$${totalPrecio.toFixed(2)}</p>
        `; // ${item.food_item_image ? `<img src="${item.food_item_image}" alt="Producto" class="img-producto me-3">` : ''}
        carritoContenido.appendChild(productoHTML);
      });
    } else {
      carritoContenido.innerHTML = `<p>No hay productos en este pedido.</p>`;
    }
  
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  
    // Descuentos
    const puntosUtilizados = pedido.points_to_use || 0;
    const descuentoPuntos = puntosUtilizados; // Suponiendo 1 punto = $1
    document.getElementById('descuento-puntos').value = `- $${descuentoPuntos.toFixed(2)}`;
  
    const descuentoCupon = pedido.coupon_id ? calcularDescuentoCupon(pedido.coupon_id, subtotal) : 0;
    document.getElementById('descuento-cupon').value = `- $${descuentoCupon.toFixed(2)}`;
  
    // Total
    const total = subtotal - descuentoPuntos - descuentoCupon + envio;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
  }
  
  // Función para calcular el descuento del cupón
  // Debes ajustar esta función según cómo manejas los cupones en tu sistema
  async function calcularDescuentoCupon(couponId, subtotal) {
    try {
      // Llamar al endpoint para obtener detalles del cupón si es necesario
      // Por ejemplo: GET /coupons/{coupon_id}/
      // Aquí asumimos que tienes un endpoint para obtener el descuento del cupón
      // Si no, ajusta según tu lógica
  
      // Suponiendo que el descuento_amount es un porcentaje (0.05 para 5%)
      const coupon = await apiRequest(`/coupons/${couponId}/`, 'GET', null, true);
      const descuento = subtotal * coupon.discount_amount;
      return descuento;
    } catch (error) {
      console.error('Error al obtener el cupón:', error);
      return 0;
    }
  }
  