// dashboard-helpers.js - Funciones auxiliares y complementarias

// ========== MODALES - STOCK ==========
function abrirModalStock() {
  const select = document.getElementById('stock-producto');
  const productosSerializados = app.productos.filter(p => p.EsSerializado);
  select.innerHTML = '<option value="">Seleccione...</option>' +
    productosSerializados.map(p => `<option value="${p.IdProducto}">${p.Modelo} (${p.MarcaNombre})</option>`).join('');

  document.getElementById('modalStock').classList.remove('hidden');
  document.getElementById('modalStock').classList.add('flex');
}

function cerrarModalStock() {
  document.getElementById('modalStock').classList.add('hidden');
  document.getElementById('formStock').reset();
}

document.getElementById('formStock').addEventListener('submit', async (e) => {
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
      await cargarStock();
      actualizarEstadisticas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar el item de stock');
  }
});

// ========== MODALES - PRODUCTO ==========
function abrirModalProducto() {
  // Cargar selects
  document.getElementById('producto-categoria').innerHTML = '<option value="">Seleccione...</option>' +
    app.categorias.map(c => `<option value="${c.IdCategoria}">${c.Nombre}</option>`).join('');

  document.getElementById('producto-marca').innerHTML = '<option value="">Seleccione...</option>' +
    app.marcas.map(m => `<option value="${m.IdMarca}">${m.Nombre}</option>`).join('');

  document.getElementById('modalProducto').classList.remove('hidden');
  document.getElementById('modalProducto').classList.add('flex');
}

function cerrarModalProducto() {
  document.getElementById('modalProducto').classList.add('hidden');
  document.getElementById('formProducto').reset();
}

document.getElementById('formProducto').addEventListener('submit', async (e) => {
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
      await cargarProductos();
      actualizarEstadisticas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar el producto');
  }
});

// ========== MODALES - CATÁLOGOS ==========
function abrirModalArea() {
  document.getElementById('modalArea').classList.remove('hidden');
  document.getElementById('modalArea').classList.add('flex');
}

function cerrarModalArea() {
  document.getElementById('modalArea').classList.add('hidden');
  document.getElementById('formArea').reset();
}

document.getElementById('formArea').addEventListener('submit', async (e) => {
  e.preventDefault();

  const datos = {
    Nombre: document.getElementById('area-nombre').value,
    Ubicacion: document.getElementById('area-ubicacion').value || null,
    CentroCosto: document.getElementById('area-centro-costo').value || null
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
      await cargarAreas();
      actualizarEstadisticas();
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

document.getElementById('formCategoria').addEventListener('submit', async (e) => {
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
      await cargarCategorias();
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

document.getElementById('formMarca').addEventListener('submit', async (e) => {
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
      await cargarMarcas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al guardar la marca');
  }
});

// ========== FUNCIONES DE ELIMINACIÓN ==========
async function eliminarArea(id) {
  if (!confirm('¿Está seguro de eliminar esta área?')) return;

  try {
    const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      await cargarAreas();
      actualizarEstadisticas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al eliminar el área');
  }
}

async function eliminarCategoria(id) {
  if (!confirm('¿Está seguro de eliminar esta categoría?')) return;

  try {
    const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      await cargarCategorias();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al eliminar la categoría');
  }
}

async function eliminarMarca(id) {
  if (!confirm('¿Está seguro de eliminar esta marca?')) return;

  try {
    const res = await fetch(`/api/marcas/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      await cargarMarcas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al eliminar la marca');
  }
}

async function eliminarProducto(id) {
  if (!confirm('¿Está seguro de eliminar este producto?')) return;

  try {
    const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      await cargarProductos();
      actualizarEstadisticas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al eliminar el producto');
  }
}

async function eliminarStockItem(id) {
  if (!confirm('¿Está seguro de eliminar este item del stock?')) return;

  try {
    const res = await fetch(`/api/stock/items/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      await cargarStock();
      actualizarEstadisticas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al eliminar el item');
  }
}

async function eliminarEntrega(id) {
  if (!confirm('¿Está seguro de eliminar esta entrega? Se revertirá el stock.')) return;

  try {
    const res = await fetch(`/api/entregas/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (result.exito) {
      mostrarExito(result.mensaje);
      await cargarEntregas();
      await cargarStock();
      actualizarEstadisticas();
    } else {
      mostrarError(result.mensaje);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al eliminar la entrega');
  }
}

// ========== UTILIDADES ==========
function formatearFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const año = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${año} ${hora}:${min}`;
}

function obtenerBadgeEstado(idEstado, nombreEstado) {
  const clases = {
    1: 'bg-green-500/10 text-green-400 border border-green-500/20',
    2: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    3: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    4: 'bg-red-500/10 text-red-400 border border-red-500/20'
  };

  return `<span class="badge ${clases[idEstado] || 'bg-gray-500/10 text-gray-400'}">${nombreEstado || 'Desconocido'}</span>`;
}

function mostrarExito(mensaje) {
  alert('✓ ' + mensaje);
}

function mostrarError(mensaje) {
  alert('✗ ' + mensaje);
}

function limpiarFiltros() {
  document.getElementById('filtro-fecha').value = '';
  document.getElementById('filtro-buscar').value = '';
  filtrarEntregas();
}

function filtrarEntregas() {
  // Implementar filtrado de entregas
  renderizarTablaEntregas();
}

async function verDetalleEntrega(id) {
  try {
    const res = await fetch(`/api/entregas/${id}`);
    const data = await res.json();

    if (data.exito) {
      const entrega = data.datos;
      let detallesHTML = entrega.Detalles.map(d => `
        - ${d.ProductoModelo} ${d.Serie ? `(Serie: ${d.Serie})` : `(Cant: ${d.CantidadEntregada})`}
      `).join('\n');

      alert(`DETALLE DE ENTREGA #${id}\n\nResponsable: ${entrega.UsuarioNombre}\nÁrea: ${entrega.AreaNombre}\nFecha: ${formatearFecha(entrega.FechaEntrega)}\n\nProductos:\n${detallesHTML}\n\nObservación: ${entrega.Observacion || 'Sin observaciones'}`);
    }
  } catch (error) {
    console.error(error);
    mostrarError('Error al cargar el detalle');
  }
}
