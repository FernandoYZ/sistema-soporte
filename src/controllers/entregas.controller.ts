// src/controllers/entregas.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ConexionSoporte } from "../config/database";
import type {
  Entrega,
  EntregaConRelaciones,
  EntregaDetalleConRelaciones,
  CrearEntrega,
} from "../types/entidades.type";
import sql from "mssql";

// Listar todas las entregas (con relaciones)
export async function listarEntregas(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query<EntregaConRelaciones>(
        `SELECT
          e.*,
          u.NombreCompleto AS UsuarioNombre,
          a.Nombre AS AreaNombre
         FROM dbo.Entregas e
         INNER JOIN dbo.Usuarios u ON e.IdUsuario = u.IdUsuario
         INNER JOIN dbo.Areas a ON e.IdArea = a.IdArea
         ORDER BY e.FechaEntrega DESC`
      );

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar entregas");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener las entregas",
    });
  }
}

// Obtener una entrega por ID (con detalles)
export async function obtenerEntrega(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    // Obtener la entrega principal
    const entregaResult = await pool
      .request()
      .input("IdEntrega", sql.Int, parseInt(id))
      .query<EntregaConRelaciones>(
        `SELECT
          e.*,
          u.NombreCompleto AS UsuarioNombre,
          a.Nombre AS AreaNombre
         FROM dbo.Entregas e
         INNER JOIN dbo.Usuarios u ON e.IdUsuario = u.IdUsuario
         INNER JOIN dbo.Areas a ON e.IdArea = a.IdArea
         WHERE e.IdEntrega = @IdEntrega`
      );

    if (entregaResult.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Entrega no encontrada",
      });
    }

    // Obtener los detalles de la entrega
    const detallesResult = await pool
      .request()
      .input("IdEntrega", sql.Int, parseInt(id))
      .query<EntregaDetalleConRelaciones>(
        `SELECT
          ed.*,
          p.Modelo AS ProductoModelo,
          si.Serie AS Serie
         FROM dbo.EntregasDetalle ed
         INNER JOIN dbo.Productos p ON ed.IdProducto = p.IdProducto
         LEFT JOIN dbo.StockItems si ON ed.IdItem = si.IdItem
         WHERE ed.IdEntrega = @IdEntrega`
      );

    const entrega = entregaResult.recordset[0];
    const detalles = detallesResult.recordset;

    return reply.status(200).send({
      exito: true,
      datos: {
        ...entrega,
        Detalles: detalles,
      },
    });
  } catch (error) {
    req.log.error({ error }, "Error al obtener entrega");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener la entrega",
    });
  }
}

// Crear una entrega nueva (con transacción)
export async function crearEntrega(
  req: FastifyRequest<{ Body: CrearEntrega }>,
  reply: FastifyReply
) {
  try {
    const { IdUsuario, IdArea, Observacion, Detalles } = req.body;

    // Validaciones
    if (!IdUsuario || !IdArea) {
      return reply.status(400).send({
        exito: false,
        mensaje: "El usuario y área son obligatorios",
      });
    }

    if (!Detalles || Detalles.length === 0) {
      return reply.status(400).send({
        exito: false,
        mensaje: "Debe incluir al menos un producto en la entrega",
      });
    }

    const pool = await ConexionSoporte(req.server);
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // 1. Crear la entrega principal
      const entregaResult = await transaction
        .request()
        .input("IdUsuario", sql.Int, IdUsuario)
        .input("IdArea", sql.Int, IdArea)
        .input("Observacion", sql.VarChar(1000), Observacion || null)
        .query<Entrega>(
          `INSERT INTO dbo.Entregas (IdUsuario, IdArea, Observacion)
           OUTPUT INSERTED.*
           VALUES (@IdUsuario, @IdArea, @Observacion)`
        );

      const idEntrega = entregaResult.recordset[0].IdEntrega;

      // 2. Procesar cada detalle
      for (const detalle of Detalles) {
        const { IdProducto, IdItem, CantidadEntregada } = detalle;

        // Validar que el producto existe y obtener si es serializado
        const productoResult = await transaction
          .request()
          .input("IdProducto", sql.Int, IdProducto)
          .query("SELECT EsSerializado FROM dbo.Productos WHERE IdProducto = @IdProducto");

        if (productoResult.recordset.length === 0) {
          throw new Error(`El producto con ID ${IdProducto} no existe`);
        }

        const esSerializado = productoResult.recordset[0].EsSerializado;

        // Validar lógica según tipo de producto
        if (esSerializado) {
          // Para productos serializados, debe haber IdItem y cantidad = 1
          if (!IdItem || CantidadEntregada !== 1) {
            throw new Error(
              `Para productos serializados, debe especificar un item y cantidad debe ser 1`
            );
          }

          // Actualizar el estado del item a "Entregado" (IdEstadoStock = 2)
          await transaction
            .request()
            .input("IdItem", sql.Int, IdItem)
            .query(
              `UPDATE dbo.StockItems
               SET IdEstadoStock = 2
               WHERE IdItem = @IdItem AND IdEstadoStock = 1`
            );
        } else {
          // Para productos no serializados, decrementar stock
          if (IdItem) {
            throw new Error(`Para productos no serializados, no debe especificar un item`);
          }

          await transaction
            .request()
            .input("IdProducto", sql.Int, IdProducto)
            .input("Cantidad", sql.Int, CantidadEntregada)
            .query(
              `UPDATE dbo.StockCantidad
               SET Cantidad = CASE
                 WHEN Cantidad - @Cantidad < 0 THEN 0
                 ELSE Cantidad - @Cantidad
               END
               WHERE IdProducto = @IdProducto`
            );
        }

        // Insertar el detalle de la entrega
        await transaction
          .request()
          .input("IdEntrega", sql.Int, idEntrega)
          .input("IdProducto", sql.Int, IdProducto)
          .input("IdItem", sql.Int, IdItem || null)
          .input("CantidadEntregada", sql.Int, CantidadEntregada)
          .query(
            `INSERT INTO dbo.EntregasDetalle
             (IdEntrega, IdProducto, IdItem, CantidadEntregada)
             VALUES (@IdEntrega, @IdProducto, @IdItem, @CantidadEntregada)`
          );
      }

      await transaction.commit();

      return reply.status(201).send({
        exito: true,
        mensaje: "Entrega registrada exitosamente",
        datos: { IdEntrega: idEntrega },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    req.log.error({ error }, "Error al crear entrega");

    return reply.status(500).send({
      exito: false,
      mensaje: error.message || "Error al crear la entrega",
    });
  }
}

// Eliminar una entrega (con rollback de stock)
export async function eliminarEntrega(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // 1. Obtener los detalles de la entrega para hacer rollback del stock
      const detallesResult = await transaction
        .request()
        .input("IdEntrega", sql.Int, parseInt(id))
        .query(
          `SELECT ed.*, p.EsSerializado
           FROM dbo.EntregasDetalle ed
           INNER JOIN dbo.Productos p ON ed.IdProducto = p.IdProducto
           WHERE ed.IdEntrega = @IdEntrega`
        );

      const detalles = detallesResult.recordset;

      // 2. Revertir cambios de stock para cada detalle
      for (const detalle of detalles) {
        if (detalle.EsSerializado && detalle.IdItem) {
          // Revertir estado del item a "En Almacén" (IdEstadoStock = 1)
          await transaction
            .request()
            .input("IdItem", sql.Int, detalle.IdItem)
            .query(
              `UPDATE dbo.StockItems
               SET IdEstadoStock = 1
               WHERE IdItem = @IdItem`
            );
        } else if (!detalle.EsSerializado) {
          // Incrementar la cantidad de stock
          await transaction
            .request()
            .input("IdProducto", sql.Int, detalle.IdProducto)
            .input("Cantidad", sql.Int, detalle.CantidadEntregada)
            .query(
              `UPDATE dbo.StockCantidad
               SET Cantidad = Cantidad + @Cantidad
               WHERE IdProducto = @IdProducto`
            );
        }
      }

      // 3. Eliminar los detalles
      await transaction
        .request()
        .input("IdEntrega", sql.Int, parseInt(id))
        .query("DELETE FROM dbo.EntregasDetalle WHERE IdEntrega = @IdEntrega");

      // 4. Eliminar la entrega principal
      const resultado = await transaction
        .request()
        .input("IdEntrega", sql.Int, parseInt(id))
        .query("DELETE FROM dbo.Entregas WHERE IdEntrega = @IdEntrega");

      if (resultado.rowsAffected[0] === 0) {
        throw new Error("Entrega no encontrada");
      }

      await transaction.commit();

      return reply.status(200).send({
        exito: true,
        mensaje: "Entrega eliminada exitosamente",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    req.log.error({ error }, "Error al eliminar entrega");

    return reply.status(500).send({
      exito: false,
      mensaje: error.message || "Error al eliminar la entrega",
    });
  }
}
