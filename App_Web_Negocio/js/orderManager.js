// menuDia.js

// Variables globales
let carrito = [];
let allItems = []; // Aquí almacenaremos todos los ítems del menú
let currentCategory = null; // Categoría actual seleccionada (null = mostrar todos)

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

document.addEventListener("DOMContentLoaded", () => {
  cargarMenu();
  asignarEventosCategoria();
  iconoCarrito.addEventListener("click", abrirCarrito);
  cerrarCarritoBtn.addEventListener("click", cerrarCarrito);
  carritoOverlay.addEventListener("click", cerrarCarrito);
});

// Mapeo de categorías a imágenes específicas
const categoriaImagenes = {
  "Entradas": "./images/Entradas.png",
  "Pizzas": "./images/PizzaP.png",
  "Postres": "./images/Postres.png",
  "Bebidas": "./images/Bebidas.png"
};

// Función para cargar el menú desde la API
async function cargarMenu() {
  try {
    const response = await apiRequest('/menu_manager/getActiveFoodItems/', 'GET', null, false);
    // Supongamos que la respuesta es un array de objetos FoodItem
    allItems = response; 
    mostrarItems(allItems);
  } catch (error) {
    console.error("Error al cargar el menú:", error);
    Swal.fire('Error', 'No se pudo cargar el menú del día.', 'error');
  }
}

// Mostrar items en el grid
function mostrarItems(items) {
  itemsGrid.innerHTML = "";
  // Filtrar por categoría si currentCategory no es null
  let itemsFiltrados = currentCategory ? items.filter(item => item.category === currentCategory) : items;
  
  if (itemsFiltrados.length === 0) {
    itemsGrid.innerHTML = `<div class="col-12"><p class="text-center">No hay elementos en esta categoría.</p></div>`;
    return;
  }

  itemsFiltrados.forEach(item => {
    const col = document.createElement("div");
    col.classList.add("col-12","col-sm-6","col-md-4","col-lg-3");

    // Determinar la imagen basada en la categoría
    const imagenCategoria = categoriaImagenes[item.category] || './images/default.png';

    // Crear la tarjeta
    col.innerHTML = `
      <div class="card h-100" data-id="${item.id}">
        <img src="${imagenCategoria}" class="card-img-top" alt="${item.name}">
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

// Manejo de categorías
function asignarEventosCategoria() {
  const links = document.querySelectorAll('.categoria-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const categoriaSeleccionada = link.dataset.category;
      
      // Verificar si la categoría está definida
      if (!categoriaSeleccionada) {
        console.warn("Categoría no definida para el enlace:", link);
        return;
      }
      
      currentCategory = categoriaSeleccionada;
      mostrarItems(allItems);
    });
  });
}

// Manejo de cantidad
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

// Abrir el carrito
function abrirCarrito() {
  carritoModal.classList.add("mostrar");
  carritoOverlay.classList.remove("oculto");
}

// Cerrar el carrito
function cerrarCarrito() {
  carritoModal.classList.remove("mostrar");
  carritoOverlay.classList.add("oculto");
}

// Agregar productos al carrito
function agregarAlCarrito(button) {
  const card = button.closest(".card");
  const id = card.dataset.id; // Obtener el id único del producto
  const nombre = card.querySelector(".card-title").textContent;
  const precio = parseFloat(card.querySelector(".card-price").textContent.replace("$", ""));
  const cantidad = parseInt(card.querySelector(".quantity-number").textContent);
  const imagen = card.querySelector("img").src; // Obtener la imagen del producto

  // Verificar si el producto ya está en el carrito por su ID
  const productoExistente = carrito.find((producto) => producto.id === id);

  if (productoExistente) {
    productoExistente.cantidad += cantidad; // Sumar la cantidad si ya existe
  } else {
    // Agregar un nuevo producto al carrito
    carrito.push({ id, nombre, precio, cantidad, imagen });
  }

  actualizarCarrito();
  abrirCarrito();
}

// Actualizar el contenido del carrito
function actualizarCarrito() {
  carritoContenido.innerHTML = "";

  let subtotal = 0;
  let totalProductos = 0; // Contador de productos

  carrito.forEach((producto, index) => {
    subtotal += producto.precio * producto.cantidad;
    totalProductos += producto.cantidad; // Sumar cantidad de cada producto

    const item = document.createElement("div");
    item.classList.add("carrito-item", "d-flex", "align-items-center", "mb-3");
    item.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}" class="me-3" style="width: 50px; height: 50px; object-fit: cover;">
      <div class="flex-grow-1">
        <p class="mb-0">${producto.nombre}</p>
        <p class="mb-0">${producto.cantidad} x $${producto.precio.toFixed(2)}</p>
      </div>
      <button onclick="eliminarDelCarrito(${index})" class="btn btn-danger btn-sm">X</button>
    `;
    carritoContenido.appendChild(item);
  });

  // Actualizar el subtotal y total
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

// Eliminar un producto del carrito
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

// Calcular descuentos
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

// Manejo de puntos acumulados
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
