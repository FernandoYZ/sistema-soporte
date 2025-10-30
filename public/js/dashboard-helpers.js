// dashboard-helpers.js - Funciones auxiliares con sistema de eventos reactivo

// ========== UTILIDADES ==========

/**
 * Muestra mensaje de éxito (temporal con alert, migrar a toast)
 */
function mostrarExito(mensaje) {
  // TODO: Implementar sistema de toast/notificaciones
  alert('✅ ' + mensaje);
}

/**
 * Muestra mensaje de error (temporal con alert, migrar a toast)
 */
function mostrarError(mensaje) {
  // TODO: Implementar sistema de toast/notificaciones
  alert('❌ ' + mensaje);
}

/**
 * Formatea una fecha a formato local
 */
function formatearFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Obtiene badge HTML de estado para stock
 */
function obtenerBadgeEstado(idEstado, nombreEstado) {
  const clases = {
    1: 'bg-green-500/10 text-green-400 border-green-500/20', // En Almacén
    2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     // Entregado
    3: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', // Mantenimiento
    4: 'bg-red-500/10 text-red-400 border-red-500/20'         // Dado de Baja
  };

  const clase = clases[idEstado] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return `<span class="badge border ${clase}">${nombreEstado || 'Desconocido'}</span>`;
}

// ========== MODALES - STOCK ==========

async function abrirModalStock() {
  try {
    // Cargar productos serializados desde el servidor
    const res = await fetch('/api/productos');
    const data = await res.json();

    if (data.exito) {
      const productosSerializados = data.datos.filter(p => p.EsSerializado);
      const select = document.getElementById('stock-producto');
      select.innerHTML = '<option value="">Seleccione...</option>' +
        productosSerializados.map(p => `<option value="${p.IdProducto}">${p.Modelo} (${p.MarcaNombre})</option>`).join('');
    }

    document.getElementById('modalStock').classList.remove('hidden');
    document.getElementById('modalStock').classList.add('flex');
  } catch (error) {
    console.error('Error al cargar productos:', error);
    mostrarError('Error al cargar productos');
  }
}

function cerrarModalStock() {
  document.getElementById('modalStock').classList.add('hidden');
  document.getElementById('formStock').reset();
}

document.getElementById('formStock')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    IdProducto: parseInt(document.getElementById('stock-producto').value),
    Serie: document.getElementById('stock-serie').value,
    UbicacionAlmacen: document.getElementById('stock-ubicacion').value || 'Data Center',
    IdEstadoStock: parseInt(document.getElementById('stock-estado').value)
  };

  try {
    const res = await fetch('/api/stock/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      cerrarModalStock();

      // Disparar eventos de refresh (el GestorRefresh se encarga automáticamente)
      // Solo refrescamos manualmente si queremos forzar actualización inmediata
      window.GestorRefresh.refrescarDespuesDeAccion(['stock', 'stats']);
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar el item de stock');
  }
});

// ========== MODALES - PRODUCTO ==========

async function abrirModalProducto() {
  try {
    // Cargar categorías y marcas desde el servidor
    const [categoriasRes, marcasRes] = await Promise.all([
      fetch('/api/categorias'),
      fetch('/api/marcas')
    ]);

    const [categorias, marcas] = await Promise.all([
      categoriasRes.json(),
      marcasRes.json()
    ]);

    if (categorias.exito) {
      document.getElementById('producto-categoria').innerHTML = '<option value="">Seleccione...</option>' +
        categorias.datos.map(c => `<option value="${c.IdCategoria}">${c.Nombre}</option>`).join('');
    }

    if (marcas.exito) {
      document.getElementById('producto-marca').innerHTML = '<option value="">Seleccione...</option>' +
        marcas.datos.map(m => `<option value="${m.IdMarca}">${m.Nombre}</option>`).join('');
    }

    document.getElementById('modalProducto').classList.remove('hidden');
    document.getElementById('modalProducto').classList.add('flex');
  } catch (error) {
    console.error('Error al cargar datos:', error);
    mostrarError('Error al cargar categorías y marcas');
  }
}

function cerrarModalProducto() {
  document.getElementById('modalProducto').classList.add('hidden');
  document.getElementById('formProducto').reset();
}

document.getElementById('formProducto')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    IdCategoria: parseInt(document.getElementById('producto-categoria').value),
    IdMarca: parseInt(document.getElementById('producto-marca').value),
    Modelo: document.getElementById('producto-modelo').value,
    SKU: document.getElementById('producto-sku').value || null,
    Descripcion: document.getElementById('producto-descripcion').value || null,
    CantidadMinima: parseInt(document.getElementById('producto-cantidad-min').value) || 0,
    EsSerializado: document.getElementById('producto-serializado').value === '1'
  };

  try {
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      cerrarModalProducto();

      // Refrescar productos y stats
      window.GestorRefresh.refrescarDespuesDeAccion(['productos', 'stats']);
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar el producto');
  }
});

// ========== MODALES - CATÁLOGOS (Área, Categoría, Marca) ==========

function abrirModalArea() {
  document.getElementById('modalArea').classList.remove('hidden');
  document.getElementById('modalArea').classList.add('flex');
}

function cerrarModalArea() {
  document.getElementById('modalArea').classList.add('hidden');
  document.getElementById('formArea').reset();
}

document.getElementById('formArea')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    Nombre: document.getElementById('area-nombre').value
  };

  try {
    const res = await fetch('/api/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      cerrarModalArea();

      window.GestorRefresh.refrescarDespuesDeAccion(['areas', 'stats']);
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar el área');
  }
});

function abrirModalCategoria() {
  document.getElementById('modalCategoria').classList.remove('hidden');
  document.getElementById('modalCategoria').classList.add('flex');
}

function cerrarModalCategoria() {
  document.getElementById('modalCategoria').classList.add('hidden');
  document.getElementById('formCategoria').reset();
}

document.getElementById('formCategoria')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    Nombre: document.getElementById('categoria-nombre').value
  };

  try {
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      cerrarModalCategoria();

      window.GestorRefresh.refrescarDespuesDeAccion(['categorias']);
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar la categoría');
  }
});

function abrirModalMarca() {
  document.getElementById('modalMarca').classList.remove('hidden');
  document.getElementById('modalMarca').classList.add('flex');
}

function cerrarModalMarca() {
  document.getElementById('modalMarca').classList.add('hidden');
  document.getElementById('formMarca').reset();
}

document.getElementById('formMarca')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    Nombre: document.getElementById('marca-nombre').value
  };

  try {
    const res = await fetch('/api/marcas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      cerrarModalMarca();

      window.GestorRefresh.refrescarDespuesDeAccion(['marcas']);
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar la marca');
  }
});

// ========== FUNCIONES DE EDICIÓN ==========

function editarProducto(id) {
  console.log('Editar producto:', id);
  // TODO: Implementar modal de edición
  alert('Funcionalidad de edición en desarrollo');
}

function editarArea(id) {
  console.log('Editar área:', id);
  // TODO: Implementar modal de edición
  alert('Funcionalidad de edición en desarrollo');
}

function editarCategoria(id) {
  console.log('Editar categoría:', id);
  // TODO: Implementar modal de edición
  alert('Funcionalidad de edición en desarrollo');
}

function editarMarca(id) {
  console.log('Editar marca:', id);
  // TODO: Implementar modal de edición
  alert('Funcionalidad de edición en desarrollo');
}

// ========== FUNCIONES DE VISUALIZACIÓN ==========

function verDetalleEntrega(id) {
  console.log('Ver detalle entrega:', id);
  // TODO: Implementar modal de detalle
  alert('Funcionalidad en desarrollo');
}

// Nota: Las funciones de eliminación ya no son necesarias aquí
// HTMX maneja los DELETE directamente con hx-delete en los botones
