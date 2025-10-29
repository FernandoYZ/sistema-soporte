// src/controllers/areas.controller.ts
import { ConexionSoporte } from "../config/database";
import type { Area, CrearArea } from "../types/entidades.type";
import sql from "mssql";

// Listar todas las áreas
export async function listarAreas({ set }: { set: any }) {
  try {
    const pool = await ConexionSoporte();
    const resultado = await pool
      .request()
      .query<Area>("SELECT * FROM dbo.Areas ORDER BY Nombre");

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset,
    };
  } catch (error) {
    console.error("Error al listar áreas:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener las áreas",
    };
  }
}

// Obtener un área por ID
export async function obtenerArea({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdArea", sql.Int, parseInt(id))
      .query<Area>("SELECT * FROM dbo.Areas WHERE IdArea = @IdArea");

    if (resultado.recordset.length === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Área no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset[0],
    };
  } catch (error) {
    console.error("Error al obtener área:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener el área",
    };
  }
}

// Crear un área nueva
export async function crearArea({ body, set }: { body: CrearArea; set: any }) {
  try {
    const { Nombre, Ubicacion, CentroCosto } = body;

    // Validación básica
    if (!Nombre || Nombre.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El nombre del área es obligatorio",
      };
    }

    const pool = await ConexionSoporte();

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

    set.status = 201;
    return {
      exito: true,
      mensaje: "Área creada exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al crear área:", error);

    // Verificar si es error de duplicado (nombre único)
    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe un área con ese nombre",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al crear el área",
    };
  }
}

// Actualizar un área existente
export async function actualizarArea({
  params,
  body,
  set,
}: {
  params: { id: string };
  body: CrearArea;
  set: any;
}) {
  try {
    const { id } = params;
    const { Nombre, Ubicacion, CentroCosto } = body;

    // Validación básica
    if (!Nombre || Nombre.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El nombre del área es obligatorio",
      };
    }

    const pool = await ConexionSoporte();

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
      set.status = 404;
      return {
        exito: false,
        mensaje: "Área no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Área actualizada exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al actualizar área:", error);

    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe un área con ese nombre",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al actualizar el área",
    };
  }
}

// Eliminar un área
export async function eliminarArea({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdArea", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Areas WHERE IdArea = @IdArea");

    if (resultado.rowsAffected[0] === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Área no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Área eliminada exitosamente",
    };
  } catch (error: any) {
    console.error("Error al eliminar área:", error);

    // Verificar si hay referencias en otras tablas (FK constraint)
    if (error.number === 547) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "No se puede eliminar el área porque está siendo utilizada en entregas",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al eliminar el área",
    };
  }
}
