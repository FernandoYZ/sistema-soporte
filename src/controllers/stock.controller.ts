// src/controllers/stock.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ConexionSoporte } from "../config/database";
import type { StockItem, StockItemConRelaciones, CrearStockItem, StockCantidad } from "../types/entidades.type";
import sql from "mssql";

// ========= STOCK ITEMS (SERIALIZADOS) =========

// Listar todos los items de stock (con relaciones)
export async function listarStockItems(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query<StockItemConRelaciones>(
        `SELECT
          si.*,
          p.Modelo AS ProductoModelo,
          es.Nombre AS EstadoNombre
         FROM dbo.StockItems si
         INNER JOIN dbo.Productos p ON si.IdProducto = p.IdProducto
         INNER JOIN dbo.TiposEstadosStock es ON si.IdEstadoStock = es.IdEstadoStock
         ORDER BY si.FechaIngreso DESC`
      );

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar stock items");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener los items de stock",
    });
  }
}

// Obtener un item de stock por ID
export async function obtenerStockItem(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdItem", sql.Int, parseInt(id))
      .query<StockItemConRelaciones>(
        `SELECT
          si.*,
          p.Modelo AS ProductoModelo,
          es.Nombre AS EstadoNombre
         FROM dbo.StockItems si
         INNER JOIN dbo.Productos p ON si.IdProducto = p.IdProducto
         INNER JOIN dbo.TiposEstadosStock es ON si.IdEstadoStock = es.IdEstadoStock
         WHERE si.IdItem = @IdItem`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Item de stock no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset[0],
    });
  } catch (error) {
    req.log.error({ error }, "Error al obtener stock item");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener el item de stock",
    });
  }
}

// Crear un item de stock nuevo (ingreso de inventario serializado)
export async function crearStockItem(
  req: FastifyRequest<{ Body: CrearStockItem }>,
  reply: FastifyReply
) {
  try {
    const { IdProducto, Serie, UbicacionAlmacen, IdEstadoStock } = req.body;

    // Validaciones
    if (!IdProducto || !Serie || Serie.trim() === "" || !IdEstadoStock) {
      return reply.status(400).send({
        exito: false,
        mensaje: "El producto, serie y estado son obligatorios",
      });
    }

    // Verificar que el producto sea serializado
    const pool = await ConexionSoporte(req.server);

    const producto = await pool
      .request()
      .input("IdProducto", sql.Int, IdProducto)
      .query("SELECT EsSerializado FROM dbo.Productos WHERE IdProducto = @IdProducto");

    if (producto.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "El producto especificado no existe",
      });
    }

    if (!producto.recordset[0].EsSerializado) {
      return reply.status(400).send({
        exito: false,
        mensaje: "Este producto no es serializado. Use la gestión de stock por cantidad.",
      });
    }

    const resultado = await pool
      .request()
      .input("IdProducto", sql.Int, IdProducto)
      .input("Serie", sql.VarChar(255), Serie.trim())
      .input("UbicacionAlmacen", sql.VarChar(100), UbicacionAlmacen || "Data Center")
      .input("IdEstadoStock", sql.Int, IdEstadoStock)
      .query<StockItem>(
        `INSERT INTO dbo.StockItems
         (IdProducto, Serie, UbicacionAlmacen, IdEstadoStock)
         OUTPUT INSERTED.*
         VALUES (@IdProducto, @Serie, @UbicacionAlmacen, @IdEstadoStock)`
      );

    return reply.status(201).send({
      exito: true,
      mensaje: "Item de stock creado exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al crear stock item");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe un item con ese número de serie",
      });
    }

    if (error.number === 547) {
      return reply.status(400).send({
        exito: false,
        mensaje: "El producto o estado especificado no existe",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al crear el item de stock",
    });
  }
}

// Actualizar un item de stock
export async function actualizarStockItem(
  req: FastifyRequest<{ Params: { id: string }; Body: Partial<CrearStockItem> }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const { Serie, UbicacionAlmacen, IdEstadoStock } = req.body;

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdItem", sql.Int, parseInt(id))
      .input("Serie", sql.VarChar(255), Serie)
      .input("UbicacionAlmacen", sql.VarChar(100), UbicacionAlmacen)
      .input("IdEstadoStock", sql.Int, IdEstadoStock)
      .query<StockItem>(
        `UPDATE dbo.StockItems
         SET Serie = COALESCE(@Serie, Serie),
             UbicacionAlmacen = COALESCE(@UbicacionAlmacen, UbicacionAlmacen),
             IdEstadoStock = COALESCE(@IdEstadoStock, IdEstadoStock)
         OUTPUT INSERTED.*
         WHERE IdItem = @IdItem`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Item de stock no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Item de stock actualizado exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al actualizar stock item");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe un item con ese número de serie",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al actualizar el item de stock",
    });
  }
}

// Eliminar un item de stock
export async function eliminarStockItem(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdItem", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.StockItems WHERE IdItem = @IdItem");

    if (resultado.rowsAffected[0] === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Item de stock no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Item de stock eliminado exitosamente",
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al eliminar stock item");

    if (error.number === 547) {
      return reply.status(409).send({
        exito: false,
        mensaje: "No se puede eliminar el item porque está siendo utilizado en entregas",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al eliminar el item de stock",
    });
  }
}

// ========= STOCK CANTIDAD (NO SERIALIZADOS) =========

// Listar todo el stock por cantidad
export async function listarStockCantidad(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query(
        `SELECT
          sc.*,
          p.Modelo AS ProductoModelo,
          c.Nombre AS CategoriaNombre,
          m.Nombre AS MarcaNombre
         FROM dbo.StockCantidad sc
         INNER JOIN dbo.Productos p ON sc.IdProducto = p.IdProducto
         INNER JOIN dbo.Categorias c ON p.IdCategoria = c.IdCategoria
         INNER JOIN dbo.Marcas m ON p.IdMarca = m.IdMarca
         ORDER BY p.Modelo`
      );

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar stock cantidad");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener el stock por cantidad",
    });
  }
}

// Actualizar cantidad de stock (incrementar o decrementar)
export async function actualizarStockCantidad(
  req: FastifyRequest<{ Params: { id: string }; Body: { Cantidad: number; Operacion: 'incrementar' | 'decrementar' | 'establecer' } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const { Cantidad, Operacion } = req.body;

    if (!Cantidad || Cantidad <= 0) {
      return reply.status(400).send({
        exito: false,
        mensaje: "La cantidad debe ser mayor a cero",
      });
    }

    const pool = await ConexionSoporte(req.server);

    let query = "";
    if (Operacion === "incrementar") {
      query = "UPDATE dbo.StockCantidad SET Cantidad = Cantidad + @Cantidad OUTPUT INSERTED.* WHERE IdProducto = @IdProducto";
    } else if (Operacion === "decrementar") {
      query = "UPDATE dbo.StockCantidad SET Cantidad = CASE WHEN Cantidad - @Cantidad < 0 THEN 0 ELSE Cantidad - @Cantidad END OUTPUT INSERTED.* WHERE IdProducto = @IdProducto";
    } else {
      query = "UPDATE dbo.StockCantidad SET Cantidad = @Cantidad OUTPUT INSERTED.* WHERE IdProducto = @IdProducto";
    }

    const resultado = await pool
      .request()
      .input("IdProducto", sql.Int, parseInt(id))
      .input("Cantidad", sql.Int, Cantidad)
      .query<StockCantidad>(query);

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Registro de stock no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Stock actualizado exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error) {
    req.log.error({ error }, "Error al actualizar stock cantidad");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al actualizar el stock",
    });
  }
}
