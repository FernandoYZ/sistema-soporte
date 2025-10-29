-- ========= 1. TABLAS MAESTRAS UNIFICADAS (CATÁLOGOS) =========

GO

-- Unificada: Áreas donde se entrega stock Y donde hay equipos.
CREATE TABLE dbo.Areas (
    IdArea INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL UNIQUE,
    Ubicacion VARCHAR(255) NULL,
    CentroCosto VARCHAR(100) NULL
);
GO

-- Unificada: Usuarios que entregan stock Y que atienden soportes.
CREATE TABLE dbo.Usuarios ( 
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    IdEmpleado INT NOT NULL, -- ID de tu otra base de datos
    Nombres VARCHAR(255) NOT NULL,
	Apellidos Varchar(255) NOT NULL,
    EstaActivo BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.Marcas (
    IdMarca INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE
);
GO

-- Unificada: Incluye categorías de Stock (Toner) y de Equipos (PC).
CREATE TABLE dbo.Categorias (
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE
);
GO

-- Unificada: El CATÁLOGO MAESTRO de todo (modelos de PC, modelos de Toner, etc).
CREATE TABLE dbo.Productos (
    IdProducto INT IDENTITY(1,1) PRIMARY KEY,
    IdCategoria INT NOT NULL FOREIGN KEY REFERENCES dbo.Categorias(IdCategoria),
    IdMarca INT NOT NULL FOREIGN KEY REFERENCES dbo.Marcas(IdMarca),
    Modelo VARCHAR(200) NOT NULL, 
    SKU VARCHAR(100) NULL UNIQUE,   -- Número de Parte
    Descripcion VARCHAR(1000) NULL,
    CantidadMinima INT NOT NULL DEFAULT 0, -- Para stock
    EsSerializado BIT NOT NULL DEFAULT 1 -- 1=Toner/PC, 0=Papel/Mouse
);
GO

-- ========= 2. TABLAS DE ALMACÉN (CONSUMIBLES Y REPUESTOS) =========

GO

CREATE TABLE dbo.TiposEstadosStock (
	IdEstadoStock INT IDENTITY(1,1) PRIMARY KEY,
	Nombre VARCHAR(100) NOT NULL UNIQUE
);
GO
INSERT INTO dbo.TiposEstadosStock (Nombre) VALUES ('En Almacén'), ('Entregado'), ('En Reparación'), ('De Baja');
GO

-- Stock de ítems serializados (Toners, RAMs de repuesto, PCs nuevas en caja)
CREATE TABLE dbo.StockItems (
    IdItem INT IDENTITY(1,1) PRIMARY KEY,
    IdProducto INT NOT NULL FOREIGN KEY REFERENCES dbo.Productos(IdProducto),
    Serie VARCHAR(255) NOT NULL UNIQUE,
    FechaIngreso DATETIME NOT NULL DEFAULT GETDATE(),
    UbicacionAlmacen VARCHAR(100) NULL DEFAULT 'Almacén TI',
    IdEstadoStock INT NOT NULL FOREIGN KEY REFERENCES dbo.TiposEstadosStock(IdEstadoStock)
);
GO

-- Stock de ítems no serializados (Papel, mouses genéricos)
CREATE TABLE dbo.StockCantidad (
    IdProducto INT PRIMARY KEY FOREIGN KEY REFERENCES dbo.Productos(IdProducto),
    Cantidad INT NOT NULL DEFAULT 0
);
GO

-- ========= 3. TABLAS DE ACTIVOS (EQUIPOS INSTALADOS) =========

GO

-- Tu tabla de Equipos, pero LIMPIA y conectada a Productos.
CREATE TABLE dbo.Equipos (
    IdEquipo INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Vínculo al catálogo maestro para saber QUÉ es (Marca, Modelo, Tipo)
    IdProducto INT NOT NULL FOREIGN KEY REFERENCES dbo.Productos(IdProducto),
    
    -- Datos únicos de esta instancia
    NumeroInventario VARCHAR(50) NOT NULL UNIQUE,
    NumeroSerie VARCHAR(100) NOT NULL UNIQUE,
    IdArea INT NOT NULL FOREIGN KEY REFERENCES dbo.Areas(IdArea),
    Observaciones VARCHAR(1000) NULL,
    FechaInstalacion DATETIME NULL
);
GO

-- ========= 4. TABLAS TRANSACCIONALES (SOPORTES Y ENTREGAS) =========

GO

-- Catálogos para Soportes
CREATE TABLE dbo.EstadosSoporte (
    IdEstado INT IDENTITY(1,1) PRIMARY KEY,
    NombreEstado VARCHAR(50) NOT NULL UNIQUE
);
GO
INSERT INTO dbo.EstadosSoporte (NombreEstado) VALUES ('Abierto'), ('Asignado'), ('En Proceso'), ('Cerrado'), ('Cancelado');
GO

CREATE TABLE dbo.Prioridades (
    IdPrioridad INT IDENTITY(1,1) PRIMARY KEY,
    NombrePrioridad VARCHAR(50) NOT NULL UNIQUE
);
GO
INSERT INTO dbo.Prioridades (NombrePrioridad) VALUES ('Baja'), ('Media'), ('Alta'), ('Urgente');
GO

-- Tabla de Tickets de Soporte
CREATE TABLE dbo.Soportes (
    IdSoporte BIGINT IDENTITY(1,1) PRIMARY KEY,
    -- El ticket es SOBRE un equipo
    IdEquipo INT NOT NULL FOREIGN KEY REFERENCES dbo.Equipos(IdEquipo),
    IdEstado INT NOT NULL FOREIGN KEY REFERENCES dbo.EstadosSoporte(IdEstado),
    IdPrioridad INT NOT NULL FOREIGN KEY REFERENCES dbo.Prioridades(IdPrioridad),
    
    -- Quién reporta y a quién se asigna
    IdEmpleadoReporta INT NOT NULL, -- ID de la BD de empleados
    NombreUsuarioReporta VARCHAR(200) NULL,
    IdUsuarioAsignado INT NULL FOREIGN KEY REFERENCES dbo.Usuarios(IdUsuario),
    
    FechaApertura DATETIME NOT NULL DEFAULT GETDATE(),
    FechaCierre DATETIME NULL,
    
    -- Descripción del problema y solución
    Diagnostico VARCHAR(4000) NULL,
    SolucionRecomendacion VARCHAR(4000) NULL
);
GO

-- Tabla de Entregas de Stock (Consumibles)
CREATE TABLE dbo.Entregas (
    IdEntrega INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NOT NULL FOREIGN KEY REFERENCES dbo.Usuarios(IdUsuario), -- Responsable
    IdArea INT NOT NULL FOREIGN KEY REFERENCES dbo.Areas(IdArea), -- A dónde fue
    FechaEntrega DATETIME NOT NULL DEFAULT GETDATE(), 
    Observacion VARCHAR(1000) NULL,
    
    -- ¡EL VÍNCULO MÁGICO! Opcional.
    -- Si esta entrega es por un ticket, se registra aquí.
    IdSoporte BIGINT NULL FOREIGN KEY REFERENCES dbo.Soportes(IdSoporte)
);
GO

-- Detalle de lo que se entregó (Toner, Papel, o un repuesto de RAM)
CREATE TABLE dbo.EntregasDetalle (
    IdEntregaDetalle INT IDENTITY(1,1) PRIMARY KEY, 
    IdEntrega INT NOT NULL FOREIGN KEY REFERENCES dbo.Entregas(IdEntrega),
    IdProducto INT NOT NULL FOREIGN KEY REFERENCES dbo.Productos(IdProducto),
    
    -- Si es serializado (Toner, RAM)
    IdItem INT NULL FOREIGN KEY REFERENCES dbo.StockItems(IdItem), 
    
    -- Cantidad (Para Tóner/RAM será 1, para Papel será N)
    CantidadEntregada INT NOT NULL,
    
    CONSTRAINT CHK_EntregaDetalle_Tipo CHECK (
        (IdItem IS NOT NULL AND CantidadEntregada = 1) OR -- Caso Serializado
        (IdItem IS NULL AND CantidadEntregada >= 1)      -- Caso No Serializado
    )
);
GO
