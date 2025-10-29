// src/controllers/categorias.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ConexionSoporte } from "../config/database";
import type { Categoria, CrearCategoria } from "../types/entidades.type";
import sql from "mssql";

// Listar todas las categorías
export async function listarCategorias(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query<Categoria>("SELECT * FROM dbo.Categorias ORDER BY Nombre");

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar categorías");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener las categorías",
    });
  }
}

// Obtener una categoría por ID
export async function obtenerCategoria(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdCategoria", sql.Int, parseInt(id))
      .query<Categoria>("SELECT * FROM dbo.Categorias WHERE IdCategoria = @IdCategoria");

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Categoría no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset[0],
    });
  } catch (error) {
    req.log.error({ error }, "Error al obtener categoría");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener la categoría",
    });
  }
}

// Crear una categoría nueva
export async function crearCategoria(
  req: FastifyRequest<{ Body: CrearCategoria }>,
  reply: FastifyReply
) {
  try {
    const { Nombre } = req.body;

    if (!Nombre || Nombre.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El nombre de la categoría es obligatorio",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("Nombre", sql.VarChar(100), Nombre.trim())
      .query<Categoria>(
        `INSERT INTO dbo.Categorias (Nombre)
         OUTPUT INSERTED.*
         VALUES (@Nombre)`
      );

    return reply.status(201).send({
      exito: true,
      mensaje: "Categoría creada exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al crear categoría");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe una categoría con ese nombre",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al crear la categoría",
    });
  }
}

// Actualizar una categoría existente
export async function actualizarCategoria(
  req: FastifyRequest<{ Params: { id: string }; Body: CrearCategoria }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const { Nombre } = req.body;

    if (!Nombre || Nombre.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El nombre de la categoría es obligatorio",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdCategoria", sql.Int, parseInt(id))
      .input("Nombre", sql.VarChar(100), Nombre.trim())
      .query<Categoria>(
        `UPDATE dbo.Categorias
         SET Nombre = @Nombre
         OUTPUT INSERTED.*
         WHERE IdCategoria = @IdCategoria`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Categoría no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Categoría actualizada exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al actualizar categoría");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe una categoría con ese nombre",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al actualizar la categoría",
    });
  }
}

// Eliminar una categoría
export async function eliminarCategoria(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdCategoria", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Categorias WHERE IdCategoria = @IdCategoria");

    if (resultado.rowsAffected[0] === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Categoría no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Categoría eliminada exitosamente",
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al eliminar categoría");

    if (error.number === 547) {
      return reply.status(409).send({
        exito: false,
        mensaje: "No se puede eliminar la categoría porque está siendo utilizada en productos",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al eliminar la categoría",
    });
  }
}
