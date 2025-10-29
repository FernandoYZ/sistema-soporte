// src/controllers/marcas.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ConexionSoporte } from "../config/database";
import type { Marca, CrearMarca } from "../types/entidades.type";
import sql from "mssql";

// Listar todas las marcas
export async function listarMarcas(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query<Marca>("SELECT * FROM dbo.Marcas ORDER BY Nombre");

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar marcas");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener las marcas",
    });
  }
}

// Obtener una marca por ID
export async function obtenerMarca(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdMarca", sql.Int, parseInt(id))
      .query<Marca>("SELECT * FROM dbo.Marcas WHERE IdMarca = @IdMarca");

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Marca no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset[0],
    });
  } catch (error) {
    req.log.error({ error }, "Error al obtener marca");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener la marca",
    });
  }
}

// Crear una marca nueva
export async function crearMarca(
  req: FastifyRequest<{ Body: CrearMarca }>,
  reply: FastifyReply
) {
  try {
    const { Nombre } = req.body;

    if (!Nombre || Nombre.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El nombre de la marca es obligatorio",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("Nombre", sql.VarChar(100), Nombre.trim())
      .query<Marca>(
        `INSERT INTO dbo.Marcas (Nombre)
         OUTPUT INSERTED.*
         VALUES (@Nombre)`
      );

    return reply.status(201).send({
      exito: true,
      mensaje: "Marca creada exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al crear marca");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe una marca con ese nombre",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al crear la marca",
    });
  }
}

// Actualizar una marca existente
export async function actualizarMarca(
  req: FastifyRequest<{ Params: { id: string }; Body: CrearMarca }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const { Nombre } = req.body;

    if (!Nombre || Nombre.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El nombre de la marca es obligatorio",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdMarca", sql.Int, parseInt(id))
      .input("Nombre", sql.VarChar(100), Nombre.trim())
      .query<Marca>(
        `UPDATE dbo.Marcas
         SET Nombre = @Nombre
         OUTPUT INSERTED.*
         WHERE IdMarca = @IdMarca`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Marca no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Marca actualizada exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al actualizar marca");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe una marca con ese nombre",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al actualizar la marca",
    });
  }
}

// Eliminar una marca
export async function eliminarMarca(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdMarca", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Marcas WHERE IdMarca = @IdMarca");

    if (resultado.rowsAffected[0] === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Marca no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Marca eliminada exitosamente",
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al eliminar marca");

    if (error.number === 547) {
      return reply.status(409).send({
        exito: false,
        mensaje: "No se puede eliminar la marca porque está siendo utilizada en productos",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al eliminar la marca",
    });
  }
}
