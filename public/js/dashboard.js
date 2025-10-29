// dashboard.js - Sistema de gestión unificado
// Estado global de la aplicación
const app = {
  entregas: [],
  stock: [],
  productos: [],
  areas: [],
  categorias: [],
  marcas: [],
  usuarios: [],
  tabActual: 'entregas'
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
  cargarDatosIniciales();
});

async function cargarDatosIniciales() {
  try {
    await Promise.all([
      cargarAreas(),
      cargarCategorias(),
      cargarMarcas(),
      cargarUsuarios(),
      cargarProductos(),
      cargarStock(),
      cargarEntregas()
    ]);

    actualizarEstadisticas();
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
    mostrarError('Error al cargar los datos del sistema');
  }
}

// ========== SISTEMA DE TABS ==========
function cambiarTab(tab) {
  app.tabActual = tab;

  // Actualizar botones con animación
  document.querySelectorAll('.tab-button').forEach(btn => {
    if (btn.dataset.tab === tab) {
      btn.classList.add('tab-active', 'text-blue-400');
      btn.classList.remove('text-dark-text-secondary');
    } else {
      btn.classList.remove('tab-active', 'text-blue-400');
      btn.classList.add('text-dark-text-secondary');
    }
  });

  // Mostrar/ocultar contenido con fade
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
    content.style.opacity = '0';
  });

  const activeTab = document.getElementById(`tab-${tab}`);
  activeTab.classList.remove('hidden');

  // Fade in animation
  setTimeout(() => {
    activeTab.style.opacity = '1';
    activeTab.style.transition = 'opacity 0.3s ease-in-out';
  }, 10);
}

// ========== ESTADÍSTICAS ==========
function actualizarEstadisticas() {
  // Stock disponible (items en almacén)
  const stockDisponible = app.stock.filter(item => item.IdEstadoStock === 1).length;
  document.getElementById('stats-stock').textContent = stockDisponible;

  // Entregas de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const entregasHoy = app.entregas.filter(e => e.FechaEntrega?.startsWith(hoy)).length;
  document.getElementById('stats-entregas').textContent = entregasHoy;

  // Total productos
  document.getElementById('stats-productos').textContent = app.productos.length;

  // Total áreas
  document.getElementById('stats-areas').textContent = app.areas.length;
}

// ========== API REQUESTS ==========
async function cargarEntregas() {
  const res = await fetch('/api/entregas');
  const data = await res.json();
  if (data.exito) {
    app.entregas = data.datos;
    renderizarTablaEntregas();
  }
}

async function cargarStock() {
  const res = await fetch('/api/stock/items');
  const data = await res.json();
  if (data.exito) {
    app.stock = data.datos;
    renderizarTablaStock();
  }
}

async function cargarProductos() {
  const res = await fetch('/api/productos');
  const data = await res.json();
  if (data.exito) {
    app.productos = data.datos;
    renderizarTablaProductos();
  }
}

async function cargarAreas() {
  const res = await fetch('/api/areas');
  const data = await res.json();
  if (data.exito) {
    app.areas = data.datos;
    renderizarListaAreas();
  }
}

async function cargarCategorias() {
  const res = await fetch('/api/categorias');
  const data = await res.json();
  if (data.exito) {
    app.categorias = data.datos;
    renderizarListaCategorias();
  }
}

async function cargarMarcas() {
  const res = await fetch('/api/marcas');
  const data = await res.json();
  if (data.exito) {
    app.marcas = data.datos;
    renderizarListaMarcas();
  }
}

async function cargarUsuarios() {
  const res = await fetch('/api/usuarios');
  const data = await res.json();
  if (data.exito) {
    app.usuarios = data.datos;
  }
}

// ========== RENDERIZADO DE TABLAS ==========
function renderizarTablaEntregas() {
  const tbody = document.getElementById('tabla-entregas');

  if (app.entregas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-dark-text-secondary">No hay entregas registradas</td></tr>';
    return;
  }

  tbody.innerHTML = app.entregas.map(entrega => `
    <tr class="hover:bg-dark-hover transition-smooth">
      <td class="px-6 py-4 text-sm text-dark-text">
        ${formatearFecha(entrega.FechaEntrega)}
      </td>
      <td class="px-6 py-4 text-sm text-dark-text">-</td>
      <td class="px-6 py-4 text-sm text-dark-text-secondary">-</td>
      <td class="px-6 py-4 text-sm text-dark-text">${entrega.UsuarioNombre || '-'}</td>
      <td class="px-6 py-4 text-sm text-dark-text">${entrega.AreaNombre || '-'}</td>
      <td class="px-6 py-4 text-sm text-dark-text-secondary">${entrega.Observacion || '-'}</td>
      <td class="px-6 py-4 text-right text-sm flex gap-2 justify-end">
        <button onclick="verDetalleEntrega(${entrega.IdEntrega})" class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-smooth" title="Ver detalle">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
        </button>
        <button onclick="eliminarEntrega(${entrega.IdEntrega})" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-smooth" title="Eliminar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderizarTablaStock() {
  const tbody = document.getElementById('tabla-stock');

  if (app.stock.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-dark-text-secondary">No hay items en stock</td></tr>';
    return;
  }

  tbody.innerHTML = app.stock.map(item => {
    const estadoBadge = obtenerBadgeEstado(item.IdEstadoStock, item.EstadoNombre);
    return `
      <tr class="hover:bg-dark-hover transition-smooth">
        <td class="px-6 py-4 text-sm font-semibold text-blue-400">${item.Serie}</td>
        <td class="px-6 py-4 text-sm text-dark-text">${item.ProductoModelo || '-'}</td>
        <td class="px-6 py-4 text-sm">${estadoBadge}</td>
        <td class="px-6 py-4 text-sm text-dark-text-secondary">${item.UbicacionAlmacen || '-'}</td>
        <td class="px-6 py-4 text-sm text-dark-text-secondary">${formatearFecha(item.FechaIngreso)}</td>
        <td class="px-6 py-4 text-right text-sm">
          <button onclick="eliminarStockItem(${item.IdItem})" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-smooth" title="Eliminar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderizarTablaProductos() {
  const tbody = document.getElementById('tabla-productos');

  if (app.productos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-dark-text-secondary">No hay productos registrados</td></tr>';
    return;
  }

  tbody.innerHTML = app.productos.map(prod => `
    <tr class="hover:bg-dark-hover transition-smooth">
      <td class="px-6 py-4 text-sm font-semibold text-dark-text">${prod.Modelo}</td>
      <td class="px-6 py-4 text-sm text-dark-text">${prod.MarcaNombre || '-'}</td>
      <td class="px-6 py-4 text-sm text-dark-text">${prod.CategoriaNombre || '-'}</td>
      <td class="px-6 py-4 text-sm text-dark-text-secondary">${prod.SKU || '-'}</td>
      <td class="px-6 py-4 text-sm">
        <span class="badge ${prod.EsSerializado ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}">
          ${prod.EsSerializado ? 'Serializado' : 'Por Cantidad'}
        </span>
      </td>
      <td class="px-6 py-4 text-right text-sm flex gap-2 justify-end">
        <button onclick="editarProducto(${prod.IdProducto})" class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-smooth" title="Editar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        <button onclick="eliminarProducto(${prod.IdProducto})" class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-smooth" title="Eliminar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// ========== RENDERIZADO DE LISTAS (CATÁLOGOS) ==========
function renderizarListaAreas() {
  const lista = document.getElementById('lista-areas');
  lista.innerHTML = app.areas.map(area => `
    <div class="flex justify-between items-center p-3 hover:bg-dark-hover rounded-xl transition-smooth">
      <span class="text-sm text-dark-text font-medium">${area.Nombre}</span>
      <div class="flex gap-1">
        <button onclick="editarArea(${area.IdArea})" class="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-smooth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        <button onclick="eliminarArea(${area.IdArea})" class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-smooth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function renderizarListaCategorias() {
  const lista = document.getElementById('lista-categorias');
  lista.innerHTML = app.categorias.map(cat => `
    <div class="flex justify-between items-center p-3 hover:bg-dark-hover rounded-xl transition-smooth">
      <span class="text-sm text-dark-text font-medium">${cat.Nombre}</span>
      <div class="flex gap-1">
        <button onclick="editarCategoria(${cat.IdCategoria})" class="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-smooth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        <button onclick="eliminarCategoria(${cat.IdCategoria})" class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-smooth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function renderizarListaMarcas() {
  const lista = document.getElementById('lista-marcas');
  lista.innerHTML = app.marcas.map(marca => `
    <div class="flex justify-between items-center p-3 hover:bg-dark-hover rounded-xl transition-smooth">
      <span class="text-sm text-dark-text font-medium">${marca.Nombre}</span>
      <div class="flex gap-1">
        <button onclick="editarMarca(${marca.IdMarca})" class="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-smooth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </button>
        <button onclick="eliminarMarca(${marca.IdMarca})" class="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-smooth">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ========== MODALES - ENTREGAS ==========
function abrirModalEntrega() {
  // Cargar selects
  cargarSelectUsuarios();
  cargarSelectAreas();

  // Limpiar items previos
  document.getElementById('items-entrega').innerHTML = '';

  // Agregar primer item
  agregarItemEntrega();

  document.getElementById('modalEntrega').classList.remove('hidden');
  document.getElementById('modalEntrega').classList.add('flex');
}

function cerrarModalEntrega() {
  document.getElementById('modalEntrega').classList.add('hidden');
  document.getElementById('formEntrega').reset();
}

function cargarSelectUsuarios() {
  const select = document.getElementById('entrega-usuario');
  select.innerHTML = '<option value="">Seleccione...</option>' +
    app.usuarios.map(u => `<option value="${u.IdUsuario}">${u.NombreCompleto}</option>`).join('');
}

function cargarSelectAreas() {
  const select = document.getElementById('entrega-area');
  select.innerHTML = '<option value="">Seleccione...</option>' +
    app.areas.map(a => `<option value="${a.IdArea}">${a.Nombre}</option>`).join('');
}

let contadorItems = 0;

function agregarItemEntrega() {
  contadorItems++;
  const container = document.getElementById('items-entrega');
  const productosSerializados = app.productos.filter(p => p.EsSerializado);
  const stockDisponible = app.stock.filter(s => s.IdEstadoStock === 1);

  const itemHTML = `
    <div class="border rounded-lg p-3 bg-gray-50" id="item-${contadorItems}">
      <div class="flex justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Item ${contadorItems}</span>
        <button type="button" onclick="eliminarItemEntrega(${contadorItems})" class="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Producto</label>
          <select class="w-full px-3 py-2 border rounded text-sm" onchange="actualizarStockDisponible(${contadorItems})">
            <option value="">Seleccione...</option>
            ${productosSerializados.map(p => `<option value="${p.IdProducto}">${p.Modelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Item de Stock</label>
          <select class="w-full px-3 py-2 border rounded text-sm">
            <option value="">Seleccione primero un producto</option>
          </select>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', itemHTML);
}

function eliminarItemEntrega(id) {
  document.getElementById(`item-${id}`)?.remove();
}

// Continuará en el siguiente bloque...
