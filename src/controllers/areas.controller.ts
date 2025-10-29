// src/controllers/areas.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ConexionSoporte } from "../config/database";
import type { Area, CrearArea } from "../types/entidades.type";
import sql from "mssql";

// Listar todas las áreas
export async function listarAreas(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query<Area>("SELECT * FROM dbo.Areas ORDER BY Nombre");

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar áreas");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener las áreas",
    });
  }
}

// Obtener un área por ID
export async function obtenerArea(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdArea", sql.Int, parseInt(id))
      .query<Area>("SELECT * FROM dbo.Areas WHERE IdArea = @IdArea");

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Área no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset[0],
    });
  } catch (error) {
    req.log.error({ error }, "Error al obtener área");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener el área",
    });
  }
}

// Crear un área nueva
export async function crearArea(
  req: FastifyRequest<{ Body: CrearArea }>,
  reply: FastifyReply
) {
  try {
    const { Nombre, Ubicacion, CentroCosto } = req.body;

    // Validación básica
    if (!Nombre || Nombre.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El nombre del área es obligatorio",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("Nombre", sql.VarChar(255), Nombre.trim())
      .input("Ubicacion", sql.VarChar(255), Ubicacion || null)
      .input("CentroCosto", sql.VarChar(100), CentroCosto || null)
      .query<Area>(
        `INSERT INTO dbo.Areas (Nombre, Ubicacion, CentroCosto)
         OUTPUT INSERTED.*
         VALUES (@Nombre, @Ubicacion, @CentroCosto)`
      );

    return reply.status(201).send({
      exito: true,
      mensaje: "Área creada exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al crear área");

    // Verificar si es error de duplicado (nombre único)
    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe un área con ese nombre",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al crear el área",
    });
  }
}

// Actualizar un área existente
export async function actualizarArea(
  req: FastifyRequest<{ Params: { id: string }; Body: CrearArea }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const { Nombre, Ubicacion, CentroCosto } = req.body;

    // Validación básica
    if (!Nombre || Nombre.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El nombre del área es obligatorio",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdArea", sql.Int, parseInt(id))
      .input("Nombre", sql.VarChar(255), Nombre.trim())
      .input("Ubicacion", sql.VarChar(255), Ubicacion || null)
      .input("CentroCosto", sql.VarChar(100), CentroCosto || null)
      .query<Area>(
        `UPDATE dbo.Areas
         SET Nombre = @Nombre,
             Ubicacion = @Ubicacion,
             CentroCosto = @CentroCosto
         OUTPUT INSERTED.*
         WHERE IdArea = @IdArea`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Área no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Área actualizada exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al actualizar área");

    if (error.number === 2627) {
      return reply.status(409).send({
        exito: false,
        mensaje: "Ya existe un área con ese nombre",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al actualizar el área",
    });
  }
}

// Eliminar un área
export async function eliminarArea(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdArea", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Areas WHERE IdArea = @IdArea");

    if (resultado.rowsAffected[0] === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Área no encontrada",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Área eliminada exitosamente",
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al eliminar área");

    // Verificar si hay referencias en otras tablas (FK constraint)
    if (error.number === 547) {
      return reply.status(409).send({
        exito: false,
        mensaje: "No se puede eliminar el área porque está siendo utilizada en entregas",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al eliminar el área",
    });
  }
}
