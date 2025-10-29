-- ========= 1. TABLAS MAESTRAS (CATÁLOGOS) =========

CREATE TABLE dbo.Areas (
    IdArea INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL UNIQUE,
    Ubicacion VARCHAR(255) NULL,
    CentroCosto VARCHAR(100) NULL
);
GO

CREATE TABLE dbo.Usuarios ( 
    -- Aprobado: Perfecto para vincular a otra BD sin FK
    -- y guardar el nombre para evitar JOINS entre servidores.
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    IdEmpleado INT NOT NULL, -- ID de tu otra base de datos
    NombreCompleto VARCHAR(255) NOT NULL,
    EstaActivo BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE dbo.Categorias (
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.Marcas (
    IdMarca INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL UNIQUE
);
GO

CREATE TABLE dbo.Productos (
    IdProducto INT IDENTITY(1,1) PRIMARY KEY,
    IdCategoria INT NOT NULL FOREIGN KEY REFERENCES dbo.Categorias(IdCategoria),
    IdMarca INT NOT NULL FOREIGN KEY REFERENCES dbo.Marcas(IdMarca),
    Modelo VARCHAR(200) NOT NULL, 
    SKU VARCHAR(100) NULL UNIQUE,
    Descripcion VARCHAR(1000) NULL,
    CantidadMinima INT NOT NULL DEFAULT 0,
    -- Aprobado: Esta columna es la clave de la lógica
    EsSerializado BIT NOT NULL DEFAULT 1 -- 1=Toner, 0=Papel
);
GO

-- Aprobado: Índices correctos en FKs y campos de búsqueda.
CREATE INDEX IX_Productos_Modelo ON dbo.Productos(Modelo);
CREATE INDEX IX_Productos_IdCategoria ON dbo.Productos(IdCategoria);
CREATE INDEX IX_Productos_IdMarca ON dbo.Productos(IdMarca);
GO

-- ========= 2. TABLAS DE STOCK (INVENTARIO) =========

-- Aprobado: Excelente normalización de los estados.
CREATE TABLE dbo.TiposEstadosStock (
	IdEstadoStock INT IDENTITY(1,1) PRIMARY KEY,
	Nombre VARCHAR(100) NOT NULL UNIQUE
);
GO

-- Insertamos los estados básicos
INSERT INTO dbo.TiposEstadosStock (Nombre) VALUES
('En Almacén'),
('Entregado'),
('En Reparación'),
('De Baja');
GO

CREATE TABLE dbo.StockItems ( -- Para Tóners (Serializados)
    IdItem INT IDENTITY(1,1) PRIMARY KEY,
    IdProducto INT NOT NULL FOREIGN KEY REFERENCES dbo.Productos(IdProducto),
    Serie VARCHAR(255) NOT NULL,
    FechaIngreso DATETIME NOT NULL DEFAULT GETDATE(),
    UbicacionAlmacen VARCHAR(100) NULL DEFAULT 'Data Center',
    IdEstadoStock INT NOT NULL FOREIGN KEY REFERENCES dbo.TiposEstadosStock(IdEstadoStock),
    
    CONSTRAINT UQ_StockItems_Serie UNIQUE (Serie)
);
GO

CREATE INDEX IX_StockItems_IdProducto ON dbo.StockItems(IdProducto);
CREATE INDEX IX_StockItems_IdEstadoStock ON dbo.StockItems(IdEstadoStock);
GO

CREATE TABLE dbo.StockCantidad ( -- Para Papel (No Serializados)
    IdProducto INT PRIMARY KEY,
    Cantidad INT NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_StockCantidad_Producto FOREIGN KEY (IdProducto) 
    REFERENCES dbo.Productos(IdProducto)
);
GO

-- ========= 3. TABLAS TRANSACCIONALES (MOVIMIENTOS) =========

CREATE TABLE dbo.Entregas (
    IdEntrega INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NOT NULL, -- Responsable de la Entrega (tu tabla dbo.Usuarios)
    IdArea INT NOT NULL, -- Área / Servicio de Entrega 
    FechaEntrega DATETIME NOT NULL DEFAULT GETDATE(), 
    Observacion VARCHAR(1000) NULL,
    
    CONSTRAINT FK_Entregas_Usuario FOREIGN KEY (IdUsuario) 
    REFERENCES dbo.Usuarios(IdUsuario),
    
    CONSTRAINT FK_Entregas_Area FOREIGN KEY (IdArea) 
    REFERENCES dbo.Areas(IdArea)
);
GO

-- Aprobado: Índices clave para reportes.
CREATE INDEX IX_Entregas_FechaEntrega ON dbo.Entregas(FechaEntrega);
CREATE INDEX IX_Entregas_IdUsuario ON dbo.Entregas(IdUsuario);
CREATE INDEX IX_Entregas_IdArea ON dbo.Entregas(IdArea);
GO

CREATE TABLE dbo.EntregasDetalle (
    IdEntregaDetalle INT IDENTITY(1,1) PRIMARY KEY, 
    IdEntrega INT NOT NULL,
    IdProducto INT NOT NULL,
    
    -- Si es serializado (Toner), se guarda el ID del ítem específico
    IdItem INT NULL, 
    
    -- Cantidad (Para Tóner será 1, para Papel será N)
    CantidadEntregada INT NOT NULL,
    
    CONSTRAINT FK_EntregasDetalle_Entrega FOREIGN KEY (IdEntrega) 
    REFERENCES dbo.Entregas(IdEntrega),
    
    CONSTRAINT FK_EntregasDetalle_Producto FOREIGN KEY (IdProducto) 
    REFERENCES dbo.Productos(IdProducto),
    
    CONSTRAINT FK_EntregasDetalle_Item FOREIGN KEY (IdItem) 
    REFERENCES dbo.StockItems(IdItem),
    
    -- Aprobado: Esta es la mejor parte de tu script.
    -- Lógica de negocio a nivel de base de datos.
    CONSTRAINT CHK_EntregaDetalle_Tipo CHECK (
        (IdItem IS NOT NULL AND CantidadEntregada = 1) OR -- Caso Toner
        (IdItem IS NULL AND CantidadEntregada >= 1 AND IdItem IS NULL) -- Caso Papel
    )
);
GO

CREATE INDEX IX_EntregasDetalle_IdEntrega ON dbo.EntregasDetalle(IdEntrega);
CREATE INDEX IX_EntregasDetalle_IdProducto ON dbo.EntregasDetalle(IdProducto);
CREATE INDEX IX_EntregasDetalle_IdItem ON dbo.EntregasDetalle(IdItem);
GO