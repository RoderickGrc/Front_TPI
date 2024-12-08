// finalizarCompra.js

let carrito = [];
let puntosAcumulados = 0;
let cupones = [];
const puntosUtilizadosElement = document.getElementById("puntos-utilizados");
const puntosAcumuladosElement = document.getElementById("puntos-acumulados");
const cuponesDescuento = document.getElementById("cupones-descuento");

const carritoContenido = document.getElementById("carrito-contenido");
const subtotalElement = document.getElementById("subtotal");
const descuentoPuntosElement = document.getElementById("descuento-puntos");
const descuentoCuponElement = document.getElementById("descuento-cupon");
const totalElement = document.getElementById("total");

const finalizarForm = document.getElementById("finalizarForm");
const envio = 3.00;

document.addEventListener("DOMContentLoaded", async () => {
  if (!isAuthenticated()) {
    window.location.href = './login.html';
    return;
  }

  await cargarCarritoDelServidor();
  actualizarCarrito();

  finalizarForm.addEventListener("submit", procesarPedido);
});

async function cargarCarritoDelServidor() {
  try {
    const data = await apiRequest('/customer/getCartItems/', 'GET', null, true);
    carrito = data.cart_items.map(item => ({
      id: item.name,
      nombre: item.name,
      precio: item.unitPrice,
      cantidad: item.quantity,
      image: item.image || null
    }));
    puntosAcumulados = data.total_points || 0;
    puntosAcumuladosElement.textContent = puntosAcumulados;

    cupones = data.available_coupons || [];
    cuponesDescuento.innerHTML = '<option value="none" selected>Sin cupones</option>';
    cupones.forEach(coupon => {
      const perc = (coupon.discount_amount * 100).toFixed(0) + '%';
      cuponesDescuento.innerHTML += `<option value="${coupon.id},${coupon.discount_amount}">Cupón ${perc}</option>`;
    });
  } catch (error) {
    console.error('Error al cargar el carrito:', error);
    Swal.fire('Error', 'No se pudo cargar el carrito.', 'error');
    carrito = [];
    puntosAcumulados = 0;
    cupones = [];
  }
}

function actualizarCarrito() {
  carritoContenido.innerHTML = "";

  let subtotal = 0;
  carrito.forEach(producto => {
    subtotal += producto.precio * producto.cantidad;
    const item = document.createElement("article");
    item.classList.add("d-flex", "justify-content-between", "align-items-center", "border-bottom", "py-2", "color-productos");
    item.innerHTML = `
      <div class="d-flex align-items-center">
        ${producto.image ? `<img src="${producto.image}" alt="Producto" class="img-producto me-3">` : ''}
        <div>
          <p class="mb-1 fw-bold">${producto.nombre}</p>
          <p class="mb-0 text-muted">x${producto.cantidad}</p>
        </div>
      </div>
      <p class="mb-0 fw-bold">$${(producto.precio * producto.cantidad).toFixed(2)}</p>
    `;
    carritoContenido.appendChild(item);
  });

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;

  const descuentoTotal = calcularDescuentos(subtotal);
  const total = subtotal - descuentoTotal + envio;
  totalElement.textContent = `$${total.toFixed(2)}`;
}

function calcularDescuentos(subtotal) {
  const puntosUtilizados = parseInt(puntosUtilizadosElement.textContent, 10) || 0;

  let descuentoPuntos = Math.min(puntosUtilizados, subtotal); 
  descuentoPuntosElement.textContent = `- $${descuentoPuntos.toFixed(2)}`;

  let descuentoCupon = 0;
  const cuponValue = cuponesDescuento.value;
  if (cuponValue !== 'none') {
    const [couponId, discountAmount] = cuponValue.split(',');
    const frac = parseFloat(discountAmount);
    if (!isNaN(frac) && frac > 0) {
      descuentoCupon = subtotal * frac;
    }
  }
  descuentoCuponElement.textContent = `- $${descuentoCupon.toFixed(2)}`;

  return descuentoPuntos + descuentoCupon;
}

function decreasePoints() {
  let puntos = parseInt(puntosUtilizadosElement.textContent, 10);
  if (puntos > 0) {
    puntosUtilizadosElement.textContent = puntos - 1;
    actualizarCarrito();
  }
}

function increasePoints() {
  let puntos = parseInt(puntosUtilizadosElement.textContent, 10);
  if (puntos < puntosAcumulados) {
    puntosUtilizadosElement.textContent = puntos + 1;
    actualizarCarrito();
  }
}

async function procesarPedido(e) {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const direccionDiferente = document.getElementById('direccion-diferente').value.trim();
  
  if (!nombre || !apellido || !correo || !telefono || !direccion) {
    Swal.fire('Error', 'Por favor complete todos los campos requeridos.', 'warning');
    return;
  }

  if (!/^\d{8}$/.test(telefono)) {
    Swal.fire('Error', 'El número de teléfono debe tener exactamente 8 dígitos.', 'warning');
    return;
  }

  const finalAddress = direccionDiferente !== '' ? direccionDiferente : direccion;
  const puntosUtilizados = parseInt(puntosUtilizadosElement.textContent, 10) || 0;
  const cuponValue = cuponesDescuento.value;
  let coupon_id = null;
  if (cuponValue !== 'none') {
    const [cId] = cuponValue.split(',');
    coupon_id = parseInt(cId,10);
  }

  // Primero asignar dirección y teléfono
  try {
    await apiRequest('/customer/asignAddress/', 'POST', { "address": finalAddress }, true);
    await apiRequest('/customer/asignPhoneNumber/', 'POST', { "phone": telefono }, true);
  } catch (error) {
    console.error('Error asignando dirección o teléfono:', error);
    Swal.fire('Error', 'No se pudo asignar la dirección o el teléfono.', 'error');
    return;
  }

  // Luego generar el pedido
  const orderPayload = {
    address: finalAddress
  };
  if (puntosUtilizados > 0) {
    orderPayload.points_to_use = puntosUtilizados;
  }
  if (coupon_id) {
    orderPayload.coupon_id = coupon_id;
  }

  try {
    const response = await apiRequest('/pedidos/userCartToOrder/', 'POST', orderPayload, true);

    Swal.fire({
      title: 'Éxito',
      text: 'Tu pedido ha sido creado exitosamente.',
      icon: 'success',
      confirmButtonText: 'Ver Pedidos'
    }).then(() => {
      window.location.href = './Pedidos.html';
    });
  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    Swal.fire('Error', error.message || 'No se pudo procesar el pedido.', 'error');
  }
}
