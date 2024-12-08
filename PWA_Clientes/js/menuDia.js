// menuDia.js

// Variables globales
let carrito = []; // Arreglo para almacenar los productos en el carrito
let allItems = []; // Arreglo para almacenar todos los productos del menú
let currentCategory = "all"; // Categoría actual seleccionada ('all' por defecto)

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

// Evento cuando el contenido del DOM está cargado
document.addEventListener("DOMContentLoaded", () => {
  cargarMenu(); // Cargar los productos desde la API
  asignarEventosCategoria(); // Asignar eventos a las categorías
  iconoCarrito.addEventListener("click", abrirCarrito); // Abrir carrito al hacer clic en el ícono
  cerrarCarritoBtn.addEventListener("click", cerrarCarrito); // Cerrar carrito al hacer clic en el botón
  carritoOverlay.addEventListener("click", cerrarCarrito); // Cerrar carrito al hacer clic fuera del modal
});

// Función para cargar el menú desde la API
async function cargarMenu() {
  try {
    const response = await apiRequest('/menu_manager/getActiveFoodItems/', 'GET', null, false);
    console.log("Datos recibidos de la API:", response); // Log para depuración

    if (!Array.isArray(response)) {
      throw new Error("La respuesta de la API no es un array.");
    }

    allItems = response; 
    mostrarItems(allItems); // Mostrar todos los productos inicialmente
  } catch (error) {
    console.error("Error al cargar el menú:", error);
    Swal.fire('Error', 'No se pudo cargar el menú del día.', 'error');
  }
}

// Función para mostrar los productos en el grid
function mostrarItems(items) {
  itemsGrid.innerHTML = ""; // Limpiar el contenido actual

  // Filtrar los productos según la categoría seleccionada
  let itemsFiltrados = currentCategory === "all" 
    ? items 
    : items.filter(item => item.category.toLowerCase() === currentCategory.toLowerCase());

  if (itemsFiltrados.length === 0) {
    itemsGrid.innerHTML = `<div class="col-12"><p class="text-center">No hay elementos en esta categoría.</p></div>`;
    return;
  }

  // Iterar sobre los productos filtrados y crear las tarjetas
  itemsFiltrados.forEach(item => {
    console.log("Mostrando item:", item); // Log para cada producto

    const col = document.createElement("div");
    col.classList.add("col-12","col-sm-6","col-md-4","col-lg-3");

    // Crear la tarjeta sin imagen
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
      e.preventDefault(); // Evitar el comportamiento por defecto del enlace

      const categoriaSeleccionada = link.dataset.category;
      
      if (!categoriaSeleccionada) {
        console.warn("Categoría no definida para el enlace:", link);
        return;
      }
      
      currentCategory = categoriaSeleccionada;
      console.log(`Categoría seleccionada: ${currentCategory}`);
      mostrarItems(allItems); // Mostrar los productos filtrados
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

// Función para agregar productos al carrito
function agregarAlCarrito(button) {
  // Verificar si el usuario está autenticado
  if (!isAuthenticated()) {
    // Redirigir a la página de login
    window.location.href = './login.html';
    return; // Detener la ejecución de la función
  }

  const card = button.closest(".card");
  const id = card.dataset.id; // Obtener el ID único del producto
  const nombre = card.querySelector(".card-title").textContent;
  const precio = parseFloat(card.querySelector(".card-price").textContent.replace("$", ""));
  const cantidad = parseInt(card.querySelector(".quantity-number").textContent, 10);

  console.log(`Agregando al carrito: ${nombre} (ID: ${id}), Cantidad: ${cantidad}, Precio: ${precio}`);

  // Verificar si el producto ya está en el carrito por su ID
  const productoExistente = carrito.find((producto) => producto.id === id);

  if (productoExistente) {
    productoExistente.cantidad += cantidad; // Sumar la cantidad si ya existe
    console.log(`Producto existente encontrado. Nueva cantidad: ${productoExistente.cantidad}`);
  } else {
    // Agregar un nuevo producto al carrito
    carrito.push({ id, nombre, precio, cantidad });
    console.log(`Producto nuevo agregado al carrito.`);
  }

  actualizarCarrito(); // Actualizar la UI del carrito
  abrirCarrito(); // Abrir el carrito para que el usuario vea los cambios
}

// Función para actualizar el contenido del carrito
function actualizarCarrito() {
  carritoContenido.innerHTML = ""; // Limpiar el contenido actual

  let subtotal = 0;
  let totalProductos = 0; // Contador de productos en el carrito

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

  console.log(`Subtotal: $${subtotal.toFixed(2)}, Descuentos: $${descuentoTotal.toFixed(2)}, Total: $${(subtotal - descuentoTotal).toFixed(2)}`);

  // Actualizar el contador del carrito
  if (totalProductos > 0) {
    contadorCarrito.textContent = totalProductos;
    contadorCarrito.style.display = "inline"; 
  } else {
    contadorCarrito.style.display = "none"; 
  }
}

// Función para eliminar un producto del carrito
function eliminarDelCarrito(index) {
  const producto = carrito[index];
  console.log(`Eliminando del carrito: ${producto.nombre} (ID: ${producto.id})`);
  carrito.splice(index, 1); // Eliminar el producto del arreglo
  actualizarCarrito(); // Actualizar la UI del carrito
}

// Función para calcular descuentos basados en puntos y cupones
function calcularDescuentos(subtotal) {
  const puntos = parseInt(puntosUtilizados.textContent, 10) || 0;
  const cupon = cuponesDescuento.value;

  let descuentoPuntos = puntos;
  let descuentoCupon = 0;

  if (cupon.includes("2%")) descuentoCupon = subtotal * 0.02;
  if (cupon.includes("5%")) descuentoCupon = subtotal * 0.05;
  if (cupon.includes("10%")) descuentoCupon = subtotal * 0.1;

  document.getElementById("descuento-puntos").textContent = `- $${descuentoPuntos.toFixed(2)}`;
  document.getElementById("descuento-cupon").textContent = `- $${descuentoCupon.toFixed(2)}`;

  return descuentoPuntos + descuentoCupon;
}

// Funciones para manejar puntos acumulados
function decreasePoints() {
  let puntos = parseInt(puntosUtilizados.textContent, 10);
  if (puntos > 0) {
    puntosUtilizados.textContent = puntos - 1;
    actualizarCarrito(); // Actualizar descuentos
  }
}

function increasePoints() {
  let puntos = parseInt(puntosUtilizados.textContent, 10);
  let maxPuntos = parseInt(puntosAcumulados.textContent, 10);
  if (puntos < maxPuntos) {
    puntosUtilizados.textContent = puntos + 1;
    actualizarCarrito(); // Actualizar descuentos
  }
}
