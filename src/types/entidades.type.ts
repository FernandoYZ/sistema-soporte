// src/types/entidades.type.ts

// ========= TABLAS MAESTRAS (CATÁLOGOS) =========

export interface Area {
  IdArea: number;
  Nombre: string;
  Ubicacion: string | null;
  CentroCosto: string | null;
}

export interface Usuario {
  IdUsuario: number;
  IdEmpleado: number;
  NombreCompleto: string;
  EstaActivo: boolean;
}

export interface Categoria {
  IdCategoria: number;
  Nombre: string;
}

export interface Marca {
  IdMarca: number;
  Nombre: string;
}

export interface Producto {
  IdProducto: number;
  IdCategoria: number;
  IdMarca: number;
  Modelo: string;
  SKU: string | null;
  Descripcion: string | null;
  CantidadMinima: number;
  EsSerializado: boolean; // true = Toner (serializado), false = Papel (cantidad)
}

export interface ProductoConRelaciones extends Producto {
  CategoriaNombre?: string;
  MarcaNombre?: string;
}

// ========= TABLAS DE STOCK (INVENTARIO) =========

export interface TipoEstadoStock {
  IdEstadoStock: number;
  Nombre: string;
}

export interface StockItem {
  IdItem: number;
  IdProducto: number;
  Serie: string;
  FechaIngreso: Date;
  UbicacionAlmacen: string | null;
  IdEstadoStock: number;
}

export interface StockItemConRelaciones extends StockItem {
  ProductoModelo?: string;
  EstadoNombre?: string;
}

export interface StockCantidad {
  IdProducto: number;
  Cantidad: number;
}

// ========= TABLAS TRANSACCIONALES (MOVIMIENTOS) =========

export interface Entrega {
  IdEntrega: number;
  IdUsuario: number;
  IdArea: number;
  FechaEntrega: Date;
  Observacion: string | null;
}

export interface EntregaConRelaciones extends Entrega {
  UsuarioNombre?: string;
  AreaNombre?: string;
}

export interface EntregaDetalle {
  IdEntregaDetalle: number;
  IdEntrega: number;
  IdProducto: number;
  IdItem: number | null; // Solo para productos serializados (toners)
  CantidadEntregada: number;
}

export interface EntregaDetalleConRelaciones extends EntregaDetalle {
  ProductoModelo?: string;
  Serie?: string;
}

// ========= DTOs PARA CREAR/ACTUALIZAR =========

export interface CrearArea {
  Nombre: string;
  Ubicacion?: string | null;
  CentroCosto?: string | null;
}

export interface CrearUsuario {
  IdEmpleado: number;
  NombreCompleto: string;
  EstaActivo?: boolean;
}

export interface CrearCategoria {
  Nombre: string;
}

export interface CrearMarca {
  Nombre: string;
}

export interface CrearProducto {
  IdCategoria: number;
  IdMarca: number;
  Modelo: string;
  SKU?: string | null;
  Descripcion?: string | null;
  CantidadMinima?: number;
  EsSerializado: boolean;
}

export interface CrearStockItem {
  IdProducto: number;
  Serie: string;
  UbicacionAlmacen?: string;
  IdEstadoStock: number;
}

export interface CrearEntrega {
  IdUsuario: number;
  IdArea: number;
  Observacion?: string | null;
  Detalles: CrearEntregaDetalle[];
}

export interface CrearEntregaDetalle {
  IdProducto: number;
  IdItem?: number | null;
  CantidadEntregada: number;
}
