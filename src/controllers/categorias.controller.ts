// src/controllers/categorias.controller.ts
import { ConexionSoporte } from "../config/database";
import type { Categoria, CrearCategoria } from "../types/entidades.type";
import sql from "mssql";

// Listar todas las categorías
export async function listarCategorias({ set }: { set: any }) {
  try {
    const pool = await ConexionSoporte();
    const resultado = await pool
      .request()
      .query<Categoria>("SELECT * FROM dbo.Categorias ORDER BY Nombre");

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset,
    };
  } catch (error) {
    console.error("Error al listar categorías:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener las categorías",
    };
  }
}

// Obtener una categoría por ID
export async function obtenerCategoria({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdCategoria", sql.Int, parseInt(id))
      .query<Categoria>("SELECT * FROM dbo.Categorias WHERE IdCategoria = @IdCategoria");

    if (resultado.recordset.length === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Categoría no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset[0],
    };
  } catch (error) {
    console.error("Error al obtener categoría:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener la categoría",
    };
  }
}

// Crear una categoría nueva
export async function crearCategoria({ body, set }: { body: CrearCategoria; set: any }) {
  try {
    const { Nombre } = body;

    if (!Nombre || Nombre.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El nombre de la categoría es obligatorio",
      };
    }

    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("Nombre", sql.VarChar(100), Nombre.trim())
      .query<Categoria>(
        `INSERT INTO dbo.Categorias (Nombre)
         OUTPUT INSERTED.*
         VALUES (@Nombre)`
      );

    set.status = 201;
    return {
      exito: true,
      mensaje: "Categoría creada exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al crear categoría:", error);

    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe una categoría con ese nombre",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al crear la categoría",
    };
  }
}

// Actualizar una categoría existente
export async function actualizarCategoria({
  params,
  body,
  set,
}: {
  params: { id: string };
  body: CrearCategoria;
  set: any;
}) {
  try {
    const { id } = params;
    const { Nombre } = body;

    if (!Nombre || Nombre.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "El nombre de la categoría es obligatorio",
      };
    }

    const pool = await ConexionSoporte();

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
      set.status = 404;
      return {
        exito: false,
        mensaje: "Categoría no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Categoría actualizada exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error);

    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe una categoría con ese nombre",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al actualizar la categoría",
    };
  }
}

// Eliminar una categoría
export async function eliminarCategoria({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdCategoria", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Categorias WHERE IdCategoria = @IdCategoria");

    if (resultado.rowsAffected[0] === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Categoría no encontrada",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Categoría eliminada exitosamente",
    };
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error);

    if (error.number === 547) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "No se puede eliminar la categoría porque está siendo utilizada en productos",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al eliminar la categoría",
    };
  }
}
