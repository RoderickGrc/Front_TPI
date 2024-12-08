// menuDia.js

// Variables globales
let carrito = []; // Carrito obtenido desde el servidor
let allItems = []; // Productos del menú
let currentCategory = "all"; // Categoría actual

// Elementos del DOM
const itemsGrid = document.getElementById("itemsGrid");
const iconoCarrito = document.getElementById("icono-carrito");
const carritoModal = document.getElementById("carrito-modal");
const carritoOverlay = document.getElementById("carrito-overlay");
const cerrarCarritoBtn = document.getElementById("cerrar-carrito");
const carritoContenido = document.getElementById("carrito-contenido");
const puntosUtilizados = document.getElementById("puntos-utilizados");
const puntosAcumulados = document.getElementById("puntos-acumulados");
const cuponesDescuento = document.getElementById("cupones-descuento");
const contadorCarrito = document.getElementById("contador-carrito");

// Elementos para control de sesión
const loginLink = document.getElementById('loginLink');
const userIcon = document.getElementById('userIcon');

// Evento cuando el contenido del DOM está cargado
document.addEventListener("DOMContentLoaded", async () => {
  // Mostrar/ocultar elementos según estado de autenticación
  if (isAuthenticated()) {
    loginLink.style.display = 'none';
    logoutLink.style.display = 'inline-block';
    // Cargar el carrito del servidor (usuario autenticado)
    await cargarCarritoDelServidor();
  } else {
    loginLink.style.display = 'inline-block';
    logoutLink.style.display = 'none';
    actualizarCarrito(); // Vacío si no hay autenticación
  }

  await cargarMenu(); // Cargar los productos del menú
  asignarEventosCategoria(); // Asignar eventos a las categorías

  iconoCarrito.addEventListener("click", abrirCarrito); // Abrir carrito
  cerrarCarritoBtn.addEventListener("click", cerrarCarrito); // Cerrar carrito
  carritoOverlay.addEventListener("click", cerrarCarrito); // Cerrar al hacer clic fuera

  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    window.location.reload();
  });
});

// Función para cargar el menú desde la API
async function cargarMenu() {
  try {
    const response = await apiRequest('/menu_manager/getActiveFoodItems/', 'GET', null, false);
    console.log("Datos recibidos de la API:", response); 

    if (!Array.isArray(response)) {
      throw new Error("La respuesta de la API no es un array.");
    }

    allItems = response; 
    mostrarItems(allItems); 
  } catch (error) {
    console.error("Error al cargar el menú:", error);
    Swal.fire('Error', 'No se pudo cargar el menú del día.', 'error');
  }
}

// Función para mostrar los productos en el grid
function mostrarItems(items) {
  itemsGrid.innerHTML = "";

  let itemsFiltrados = currentCategory === "all" 
    ? items 
    : items.filter(item => item.category && item.category.toLowerCase() === currentCategory.toLowerCase());

  if (itemsFiltrados.length === 0) {
    itemsGrid.innerHTML = `<div class="col-12"><p class="text-center">No hay elementos en esta categoría.</p></div>`;
    return;
  }

  itemsFiltrados.forEach(item => {
    const col = document.createElement("div");
    col.classList.add("col-12","col-sm-6","col-md-4","col-lg-3");

    col.innerHTML = `
      <div class="card h-100" data-id="${item.id}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${item.name}</h5>
          <p class="card-text">${item.description || ''}</p>
          <p class="card-price fw-bold mb-3">$${item.unitPrice.toFixed(2)}</p>
          
          <div class="d-flex align-items-center mb-3">
            <button class="btn btn-outline-secondary btn-sm" onclick="decreaseQuantity(this)">-</button>
            <span class="quantity-number mx-2">1</span>
            <button class="btn btn-outline-secondary btn-sm" onclick="increaseQuantity(this)">+</button>
          </div>
          
          <button class="btn btn-primary mt-auto" onclick="agregarAlCarrito(this)">Agregar al Carrito</button>
        </div>
      </div>
    `;

    itemsGrid.appendChild(col);
  });
}

// Función para asignar eventos a los enlaces de categorías
function asignarEventosCategoria() {
  const links = document.querySelectorAll('.categoria-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const categoriaSeleccionada = link.dataset.category;
      if (!categoriaSeleccionada) return;
      
      currentCategory = categoriaSeleccionada;
      console.log(`Categoría seleccionada: ${currentCategory}`);
      mostrarItems(allItems);
    });
  });
}

// Funciones para manejar la cantidad de productos
function decreaseQuantity(button) {
  const quantityElement = button.parentElement.querySelector(".quantity-number");
  let quantity = parseInt(quantityElement.textContent, 10);
  if (quantity > 1) {
    quantity--;
    quantityElement.textContent = quantity;
  }
}

function increaseQuantity(button) {
  const quantityElement = button.parentElement.querySelector(".quantity-number");
  let quantity = parseInt(quantityElement.textContent, 10);
  quantity++;
  quantityElement.textContent = quantity;
}

// Funciones para abrir y cerrar el carrito
function abrirCarrito() {
  carritoModal.classList.add("mostrar");
  carritoOverlay.classList.remove("oculto");
}

function cerrarCarrito() {
  carritoModal.classList.remove("mostrar");
  carritoOverlay.classList.add("oculto");
}

// Función para cargar el carrito desde el servidor (si autenticado)
async function cargarCarritoDelServidor() {
  try {
    const data = await apiRequest('/customer/getCartItems/', 'GET', null, true);
    // Mapear los datos a nuestro formato interno de carrito
    carrito = data.cart_items.map(item => ({
      id: item.name, 
      nombre: item.name,
      precio: item.unitPrice,
      cantidad: item.quantity
    }));

    puntosAcumulados.textContent = data.total_points || 0;

    // Cargar cupones desde el servidor
    cuponesDescuento.innerHTML = '';
    if (data.available_coupons && data.available_coupons.length > 0) {
      cuponesDescuento.innerHTML = '<option value="none" selected>Ninguno</option>';
      data.available_coupons.forEach(coupon => {
        const discount_fraction = coupon.discount_amount;
        const perc = (discount_fraction * 100).toFixed(0) + '%';
        cuponesDescuento.innerHTML += `<option value="${discount_fraction}">Cupón ${perc}</option>`;
      });
    } else {
      cuponesDescuento.innerHTML = '<option value="none" selected>Sin cupones</option>';
    }

    actualizarCarrito();
  } catch (error) {
    console.error('Error al cargar el carrito desde el servidor:', error);
    // Si falla, asumimos carrito vacío
    carrito = [];
    puntosAcumulados.textContent = '0';
    cuponesDescuento.innerHTML = '<option value="none" selected>Sin cupones</option>';
    actualizarCarrito();
  }
}

// Función para agregar productos al carrito
async function agregarAlCarrito(button) {
  // Verificar si el usuario está autenticado
  if (!isAuthenticated()) {
    // Redirigir a la página de login
    window.location.href = './login.html';
    return;
  }

  const card = button.closest(".card");
  const id = parseInt(card.dataset.id,10);
  const nombre = card.querySelector(".card-title").textContent;
  const precio = parseFloat(card.querySelector(".card-price").textContent.replace("$", ""));
  const cantidad = parseInt(card.querySelector(".quantity-number").textContent, 10);

  console.log(`Agregando al carrito (server): ${nombre} (ID: ${id}), Cantidad: ${cantidad}, Precio: ${precio}`);

  try {
    await apiRequest('/customer/addToCart/', 'POST', { food_item: id, quantity: cantidad }, true);
    await cargarCarritoDelServidor();
    abrirCarrito();
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    Swal.fire('Error', 'No se pudo agregar el producto al carrito.', 'error');
  }
}

// Función para actualizar el contenido del carrito localmente
function actualizarCarrito() {
  carritoContenido.innerHTML = "";

  let subtotal = 0;
  let totalProductos = 0; 

  carrito.forEach((producto, index) => {
    subtotal += producto.precio * producto.cantidad;
    totalProductos += producto.cantidad;

    const item = document.createElement("div");
    item.classList.add("carrito-item", "d-flex", "align-items-center", "mb-3");
    item.innerHTML = `
      <div class="flex-grow-1">
        <p class="mb-0">${producto.nombre}</p>
        <p class="mb-0">${producto.cantidad} x $${producto.precio.toFixed(2)}</p>
      </div>
      <button onclick="eliminarDelCarrito(${index})" class="btn btn-danger btn-sm">X</button>
    `;
    carritoContenido.appendChild(item);
  });

  // Calcular y aplicar descuentos
  const descuentoTotal = calcularDescuentos(subtotal);
  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("total").textContent = `$${(subtotal - descuentoTotal).toFixed(2)}`;

  // Actualizar el contador del carrito
  if (totalProductos > 0) {
    contadorCarrito.textContent = totalProductos;
    contadorCarrito.style.display = "inline"; 
  } else {
    contadorCarrito.style.display = "none"; 
  }
}

// Función para eliminar un producto del carrito
async function eliminarDelCarrito(index) {
  const producto = carrito[index];
  console.log(`Eliminando del carrito (server): ${producto.nombre}`);

  try {
    await apiRequest(`/customer/deleteCartItem/${encodeURIComponent(producto.nombre)}/`, 'DELETE', null, true);
    await cargarCarritoDelServidor();
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    Swal.fire('Error', 'No se pudo eliminar el producto del carrito.', 'error');
  }
}

// Función para calcular descuentos basados en puntos y cupones
function calcularDescuentos(subtotal) {
  const puntos = parseInt(puntosUtilizados.textContent, 10) || 0;
  const cuponValue = cuponesDescuento.value;

  let descuentoPuntos = puntos; // Asumiendo que cada punto equivale a $1 de descuento
  let descuentoCupon = 0;

  if (cuponValue !== 'none') {
    const cuponFraction = parseFloat(cuponValue);
    if (!isNaN(cuponFraction) && cuponFraction > 0) {
      descuentoCupon = subtotal * cuponFraction;
    }
  }

  document.getElementById("descuento-puntos").textContent = `- $${descuentoPuntos.toFixed(2)}`;
  document.getElementById("descuento-cupon").textContent = `- $${descuentoCupon.toFixed(2)}`;

  return descuentoPuntos + descuentoCupon;
}

// Funciones para manejar puntos
function decreasePoints() {
  let puntos = parseInt(puntosUtilizados.textContent, 10);
  if (puntos > 0) {
    puntosUtilizados.textContent = puntos - 1;
    actualizarCarrito();
  }
}

function increasePoints() {
  let puntos = parseInt(puntosUtilizados.textContent, 10);
  let maxPuntos = parseInt(puntosAcumulados.textContent, 10);
  if (puntos < maxPuntos) {
    puntosUtilizados.textContent = puntos + 1;
    actualizarCarrito();
  }
}
