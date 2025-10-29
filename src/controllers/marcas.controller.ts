// src/controllers/marcas.controller.ts
import { ConexionSoporte } from "../config/database";
import type { Marca, CrearMarca } from "../types/entidades.type";
import sql from "mssql";

// Listar todas las marcas
export async function listarMarcas({ set }: { set: any }) {
  try {
    const pool = await ConexionSoporte();
    const resultado = await pool
      .request()
      .query<Marca>("SELECT * FROM dbo.Marcas ORDER BY Nombre");

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset,
    };
  } catch (error) {
    console.error("Error al listar marcas:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener las marcas",
    };
  }
}

// Obtener una marca por ID
export async function obtenerMarca({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdMarca", sql.Int, parseInt(id))
      .query<Marca>("SELECT * FROM dbo.Marcas WHERE IdMarca = @IdMarca");

    if (resultado.recordset.length === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Marca no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset[0],
    };
  } catch (error) {
    console.error("Error al obtener marca:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener la marca",
    };
  }
}

// Crear una marca nueva
export async function crearMarca({ body, set }: { body: CrearMarca; set: any }) {
  try {
    const { Nombre } = body;

    if (!Nombre || Nombre.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El nombre de la marca es obligatorio",
      };
    }

    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("Nombre", sql.VarChar(100), Nombre.trim())
      .query<Marca>(
        `INSERT INTO dbo.Marcas (Nombre)
         OUTPUT INSERTED.*
         VALUES (@Nombre)`
      );

    set.status = 201;
    return {
      exito: true,
      mensaje: "Marca creada exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al crear marca:", error);

    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe una marca con ese nombre",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al crear la marca",
    };
  }
}

// Actualizar una marca existente
export async function actualizarMarca({
  params,
  body,
  set,
}: {
  params: { id: string };
  body: CrearMarca;
  set: any;
}) {
  try {
    const { id } = params;
    const { Nombre } = body;

    if (!Nombre || Nombre.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El nombre de la marca es obligatorio",
      };
    }

    const pool = await ConexionSoporte();

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
      set.status = 404;
      return {
        exito: false,
        mensaje: "Marca no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Marca actualizada exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al actualizar marca:", error);

    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe una marca con ese nombre",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al actualizar la marca",
    };
  }
}

// Eliminar una marca
export async function eliminarMarca({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdMarca", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Marcas WHERE IdMarca = @IdMarca");

    if (resultado.rowsAffected[0] === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Marca no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Marca eliminada exitosamente",
    };
  } catch (error: any) {
    console.error("Error al eliminar marca:", error);

    if (error.number === 547) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "No se puede eliminar la marca porque está siendo utilizada en productos",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al eliminar la marca",
    };
  }
}
