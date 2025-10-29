// src/controllers/usuarios.controller.ts
import { ConexionSoporte } from "../config/database";
import type { Usuario, CrearUsuario } from "../types/entidades.type";
import sql from "mssql";

// Listar todos los usuarios
export async function listarUsuarios({ set }: { set: any }) {
  try {
    const pool = await ConexionSoporte();
    const resultado = await pool
      .request()
      .query<Usuario>("SELECT * FROM dbo.Usuarios ORDER BY Apellidos, Nombres");

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset,
    };
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener los usuarios",
    };
  }
}

// Obtener un usuario por ID
export async function obtenerUsuario({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdUsuario", sql.Int, parseInt(id))
      .query<Usuario>("SELECT * FROM dbo.Usuarios WHERE IdUsuario = @IdUsuario");

    if (resultado.recordset.length === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Usuario no encontrado",
      };
    }

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset[0],
    };
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener el usuario",
    };
  }
}

// Crear un usuario nuevo
export async function crearUsuario({ body, set }: { body: CrearUsuario; set: any }) {
  try {
    const { IdEmpleado, Nombres, Apellidos, EstaActivo } = body;

    if (!IdEmpleado || !Nombres || Nombres.trim() === "" || !Apellidos || Apellidos.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El ID de empleado, nombres y apellidos son obligatorios",
      };
    }

    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdEmpleado", sql.Int, IdEmpleado)
      .input("Nombres", sql.VarChar(255), Nombres.trim())
      .input("Apellidos", sql.VarChar(255), Apellidos.trim())
      .input("EstaActivo", sql.Bit, EstaActivo !== undefined ? EstaActivo : true)
      .query<Usuario>(
        `INSERT INTO dbo.Usuarios (IdEmpleado, Nombres, Apellidos, EstaActivo)
         OUTPUT INSERTED.*
         VALUES (@IdEmpleado, @Nombres, @Apellidos, @EstaActivo)`
      );

    set.status = 201;
    return {
      exito: true,
      mensaje: "Usuario creado exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al crear usuario:", error);

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al crear el usuario",
    };
  }
}

// Actualizar un usuario existente
export async function actualizarUsuario({
  params,
  body,
  set,
}: {
  params: { id: string };
  body: CrearUsuario;
  set: any;
}) {
  try {
    const { id } = params;
    const { IdEmpleado, Nombres, Apellidos, EstaActivo } = body;

    if (!IdEmpleado || !Nombres || Nombres.trim() === "" || !Apellidos || Apellidos.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El ID de empleado, nombres y apellidos son obligatorios",
      };
    }

    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdUsuario", sql.Int, parseInt(id))
      .input("IdEmpleado", sql.Int, IdEmpleado)
      .input("Nombres", sql.VarChar(255), Nombres.trim())
      .input("Apellidos", sql.VarChar(255), Apellidos.trim())
      .input("EstaActivo", sql.Bit, EstaActivo !== undefined ? EstaActivo : true)
      .query<Usuario>(
        `UPDATE dbo.Usuarios
         SET IdEmpleado = @IdEmpleado,
             Nombres = @Nombres,
             Apellidos = @Apellidos,
             EstaActivo = @EstaActivo
         OUTPUT INSERTED.*
         WHERE IdUsuario = @IdUsuario`
      );

    if (resultado.recordset.length === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Usuario no encontrado",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Usuario actualizado exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error);

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al actualizar el usuario",
    };
  }
}

// Eliminar un usuario
export async function eliminarUsuario({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdUsuario", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Usuarios WHERE IdUsuario = @IdUsuario");

    if (resultado.rowsAffected[0] === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Usuario no encontrado",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Usuario eliminado exitosamente",
    };
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);

    if (error.number === 547) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "No se puede eliminar el usuario porque está siendo utilizado en entregas",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al eliminar el usuario",
    };
  }
}
