// src/controllers/productos.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ConexionSoporte } from "../config/database";
import type { Producto, ProductoConRelaciones, CrearProducto } from "../types/entidades.type";
import sql from "mssql";

// Listar todos los productos (con relaciones)
export async function listarProductos(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query<ProductoConRelaciones>(
        `SELECT
          p.*,
          c.Nombre AS CategoriaNombre,
          m.Nombre AS MarcaNombre
         FROM dbo.Productos p
         INNER JOIN dbo.Categorias c ON p.IdCategoria = c.IdCategoria
         INNER JOIN dbo.Marcas m ON p.IdMarca = m.IdMarca
         ORDER BY p.Modelo`
      );

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar productos");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener los productos",
    });
  }
}

// Obtener un producto por ID (con relaciones)
export async function obtenerProducto(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdProducto", sql.Int, parseInt(id))
      .query<ProductoConRelaciones>(
        `SELECT
          p.*,
          c.Nombre AS CategoriaNombre,
          m.Nombre AS MarcaNombre
         FROM dbo.Productos p
         INNER JOIN dbo.Categorias c ON p.IdCategoria = c.IdCategoria
         INNER JOIN dbo.Marcas m ON p.IdMarca = m.IdMarca
         WHERE p.IdProducto = @IdProducto`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Producto no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset[0],
    });
  } catch (error) {
    req.log.error({ error }, "Error al obtener producto");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener el producto",
    });
  }
}

// Crear un producto nuevo
export async function crearProducto(
  req: FastifyRequest<{ Body: CrearProducto }>,
  reply: FastifyReply
) {
  try {
    const {
      IdCategoria,
      IdMarca,
      Modelo,
      SKU,
      Descripcion,
      CantidadMinima,
      EsSerializado,
    } = req.body;

    // Validaciones
    if (!IdCategoria || !IdMarca || !Modelo || Modelo.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "La categoría, marca y modelo son obligatorios",
      });
    }

    if (EsSerializado === undefined) {
      return reply.status(400).send({
        exito: false,
        mensaje: "Debe especificar si el producto es serializado o no",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdCategoria", sql.Int, IdCategoria)
      .input("IdMarca", sql.Int, IdMarca)
      .input("Modelo", sql.VarChar(200), Modelo.trim())
      .input("SKU", sql.VarChar(100), SKU || null)
      .input("Descripcion", sql.VarChar(1000), Descripcion || null)
      .input("CantidadMinima", sql.Int, CantidadMinima || 0)
      .input("EsSerializado", sql.Bit, EsSerializado)
      .query<Producto>(
        `INSERT INTO dbo.Productos
         (IdCategoria, IdMarca, Modelo, SKU, Descripcion, CantidadMinima, EsSerializado)
         OUTPUT INSERTED.*
         VALUES (@IdCategoria, @IdMarca, @Modelo, @SKU, @Descripcion, @CantidadMinima, @EsSerializado)`
      );

    // Si el producto no es serializado, crear registro en StockCantidad
    if (!EsSerializado) {
      await pool
        .request()
        .input("IdProducto", sql.Int, resultado.recordset[0].IdProducto)
        .query(
          `INSERT INTO dbo.StockCantidad (IdProducto, Cantidad)
           VALUES (@IdProducto, 0)`
        );
    }

    return reply.status(201).send({
      exito: true,
      mensaje: "Producto creado exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al crear producto");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe un producto con ese SKU",
      });
    }

    if (error.number === 547) {
      return reply.status(400).send({
        exito: false,
        mensaje: "La categoría o marca especificada no existe",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al crear el producto",
    });
  }
}

// Actualizar un producto existente
export async function actualizarProducto(
  req: FastifyRequest<{ Params: { id: string }; Body: CrearProducto }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const {
      IdCategoria,
      IdMarca,
      Modelo,
      SKU,
      Descripcion,
      CantidadMinima,
      EsSerializado,
    } = req.body;

    if (!IdCategoria || !IdMarca || !Modelo || Modelo.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "La categoría, marca y modelo son obligatorios",
      });
    }

    if (EsSerializado === undefined) {
      return reply.status(400).send({
        exito: false,
        mensaje: "Debe especificar si el producto es serializado o no",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdProducto", sql.Int, parseInt(id))
      .input("IdCategoria", sql.Int, IdCategoria)
      .input("IdMarca", sql.Int, IdMarca)
      .input("Modelo", sql.VarChar(200), Modelo.trim())
      .input("SKU", sql.VarChar(100), SKU || null)
      .input("Descripcion", sql.VarChar(1000), Descripcion || null)
      .input("CantidadMinima", sql.Int, CantidadMinima || 0)
      .input("EsSerializado", sql.Bit, EsSerializado)
      .query<Producto>(
        `UPDATE dbo.Productos
         SET IdCategoria = @IdCategoria,
             IdMarca = @IdMarca,
             Modelo = @Modelo,
             SKU = @SKU,
             Descripcion = @Descripcion,
             CantidadMinima = @CantidadMinima,
             EsSerializado = @EsSerializado
         OUTPUT INSERTED.*
         WHERE IdProducto = @IdProducto`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Producto no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Producto actualizado exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al actualizar producto");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe un producto con ese SKU",
      });
    }

    if (error.number === 547) {
      return reply.status(400).send({
        exito: false,
        mensaje: "La categoría o marca especificada no existe",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al actualizar el producto",
    });
  }
}

// Eliminar un producto
export async function eliminarProducto(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdProducto", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Productos WHERE IdProducto = @IdProducto");

    if (resultado.rowsAffected[0] === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Producto no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Producto eliminado exitosamente",
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al eliminar producto");

    if (error.number === 547) {
      return reply.status(409).send({
        exito: false,
        mensaje: "No se puede eliminar el producto porque tiene stock o entregas asociadas",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al eliminar el producto",
    });
  }
}
