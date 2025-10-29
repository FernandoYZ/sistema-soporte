// src/controllers/usuarios.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { ConexionSoporte } from "../config/database";
import type { Usuario, CrearUsuario } from "../types/entidades.type";
import sql from "mssql";

// Listar todos los usuarios
export async function listarUsuarios(req: FastifyRequest, reply: FastifyReply) {
  try {
    const pool = await ConexionSoporte(req.server);
    const resultado = await pool
      .request()
      .query<Usuario>("SELECT * FROM dbo.Usuarios ORDER BY NombreCompleto");

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset,
    });
  } catch (error) {
    req.log.error({ error }, "Error al listar usuarios");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener los usuarios",
    });
  }
}

// Obtener un usuario por ID
export async function obtenerUsuario(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdUsuario", sql.Int, parseInt(id))
      .query<Usuario>("SELECT * FROM dbo.Usuarios WHERE IdUsuario = @IdUsuario");

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Usuario no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      datos: resultado.recordset[0],
    });
  } catch (error) {
    req.log.error({ error }, "Error al obtener usuario");
    return reply.status(500).send({
      exito: false,
      mensaje: "Error al obtener el usuario",
    });
  }
}

// Crear un usuario nuevo
export async function crearUsuario(
  req: FastifyRequest<{ Body: CrearUsuario }>,
  reply: FastifyReply
) {
  try {
    const { IdEmpleado, NombreCompleto, EstaActivo } = req.body;

    if (!IdEmpleado || !NombreCompleto || NombreCompleto.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El ID de empleado y nombre completo son obligatorios",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdEmpleado", sql.Int, IdEmpleado)
      .input("NombreCompleto", sql.VarChar(255), NombreCompleto.trim())
      .input("EstaActivo", sql.Bit, EstaActivo !== undefined ? EstaActivo : true)
      .query<Usuario>(
        `INSERT INTO dbo.Usuarios (IdEmpleado, NombreCompleto, EstaActivo)
         OUTPUT INSERTED.*
         VALUES (@IdEmpleado, @NombreCompleto, @EstaActivo)`
      );

    return reply.status(201).send({
      exito: true,
      mensaje: "Usuario creado exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al crear usuario");

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al crear el usuario",
    });
  }
}

// Actualizar un usuario existente
export async function actualizarUsuario(
  req: FastifyRequest<{ Params: { id: string }; Body: CrearUsuario }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const { IdEmpleado, NombreCompleto, EstaActivo } = req.body;

    if (!IdEmpleado || !NombreCompleto || NombreCompleto.trim() === "") {
      return reply.status(400).send({
        exito: false,
        mensaje: "El ID de empleado y nombre completo son obligatorios",
      });
    }

    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdUsuario", sql.Int, parseInt(id))
      .input("IdEmpleado", sql.Int, IdEmpleado)
      .input("NombreCompleto", sql.VarChar(255), NombreCompleto.trim())
      .input("EstaActivo", sql.Bit, EstaActivo !== undefined ? EstaActivo : true)
      .query<Usuario>(
        `UPDATE dbo.Usuarios
         SET IdEmpleado = @IdEmpleado,
             NombreCompleto = @NombreCompleto,
             EstaActivo = @EstaActivo
         OUTPUT INSERTED.*
         WHERE IdUsuario = @IdUsuario`
      );

    if (resultado.recordset.length === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Usuario no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Usuario actualizado exitosamente",
      datos: resultado.recordset[0],
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al actualizar usuario");

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al actualizar el usuario",
    });
  }
}

// Eliminar un usuario
export async function eliminarUsuario(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const pool = await ConexionSoporte(req.server);

    const resultado = await pool
      .request()
      .input("IdUsuario", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Usuarios WHERE IdUsuario = @IdUsuario");

    if (resultado.rowsAffected[0] === 0) {
      return reply.status(404).send({
        exito: false,
        mensaje: "Usuario no encontrado",
      });
    }

    return reply.status(200).send({
      exito: true,
      mensaje: "Usuario eliminado exitosamente",
    });
  } catch (error: any) {
    req.log.error({ error }, "Error al eliminar usuario");

    if (error.number === 547) {
      return reply.status(409).send({
        exito: false,
        mensaje: "No se puede eliminar el usuario porque está siendo utilizado en entregas",
      });
    }

    return reply.status(500).send({
      exito: false,
      mensaje: "Error al eliminar el usuario",
    });
  }
}
