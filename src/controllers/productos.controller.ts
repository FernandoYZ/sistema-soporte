// src/controllers/productos.controller.ts
import { ConexionSoporte } from "../config/database";
import type { Producto, ProductoConRelaciones, CrearProducto } from "../types/entidades.type";
import sql from "mssql";

// Listar todos los productos (con relaciones)
export async function listarProductos({ set }: { set: any }) {
  try {
    const pool = await ConexionSoporte();
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

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset,
    };
  } catch (error) {
    console.error("Error al listar productos:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener los productos",
    };
  }
}

// Obtener un producto por ID (con relaciones)
export async function obtenerProducto({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

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
      set.status = 404;
      return {
        exito: false,
        mensaje: "Producto no encontrado",
      };
    }

    set.status = 200;
    return {
      exito: true,
      datos: resultado.recordset[0],
    };
  } catch (error) {
    console.error("Error al obtener producto:", error);
    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al obtener el producto",
    };
  }
}

// Crear un producto nuevo
export async function crearProducto({ body, set }: { body: CrearProducto; set: any }) {
  try {
    const {
      IdCategoria,
      IdMarca,
      Modelo,
      SKU,
      Descripcion,
      CantidadMinima,
      EsSerializado,
    } = body;

    // Validaciones
    if (!IdCategoria || !IdMarca || !Modelo || Modelo.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "La categoría, marca y modelo son obligatorios",
      };
    }

    if (EsSerializado === undefined) {
      set.status = 400;
      return {
        exito: false,
        mensaje: "Debe especificar si el producto es serializado o no",
      };
    }

    const pool = await ConexionSoporte();

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

    set.status = 201;
    return {
      exito: true,
      mensaje: "Producto creado exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al crear producto:", error);

    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe un producto con ese SKU",
      };
    }

    if (error.number === 547) {
      set.status = 400;
      return {
        exito: false,
        mensaje: "La categoría o marca especificada no existe",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al crear el producto",
    };
  }
}

// Actualizar un producto existente
export async function actualizarProducto({
  params,
  body,
  set,
}: {
  params: { id: string };
  body: CrearProducto;
  set: any;
}) {
  try {
    const { id } = params;
    const {
      IdCategoria,
      IdMarca,
      Modelo,
      SKU,
      Descripcion,
      CantidadMinima,
      EsSerializado,
    } = body;

    if (!IdCategoria || !IdMarca || !Modelo || Modelo.trim() === "") {
      set.status = 400;
      return {
        exito: false,
        mensaje: "La categoría, marca y modelo son obligatorios",
      };
    }

    if (EsSerializado === undefined) {
      set.status = 400;
      return {
        exito: false,
        mensaje: "Debe especificar si el producto es serializado o no",
      };
    }

    const pool = await ConexionSoporte();

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
      set.status = 404;
      return {
        exito: false,
        mensaje: "Producto no encontrado",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Producto actualizado exitosamente",
      datos: resultado.recordset[0],
    };
  } catch (error: any) {
    console.error("Error al actualizar producto:", error);

    if (error.number === 2627) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "Ya existe un producto con ese SKU",
      };
    }

    if (error.number === 547) {
      set.status = 400;
      return {
        exito: false,
        mensaje: "La categoría o marca especificada no existe",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al actualizar el producto",
    };
  }
}

// Eliminar un producto
export async function eliminarProducto({ params, set }: { params: { id: string }; set: any }) {
  try {
    const { id } = params;
    const pool = await ConexionSoporte();

    const resultado = await pool
      .request()
      .input("IdProducto", sql.Int, parseInt(id))
      .query("DELETE FROM dbo.Productos WHERE IdProducto = @IdProducto");

    if (resultado.rowsAffected[0] === 0) {
      set.status = 404;
      return {
        exito: false,
        mensaje: "Producto no encontrado",
      };
    }

    set.status = 200;
    return {
      exito: true,
      mensaje: "Producto eliminado exitosamente",
    };
  } catch (error: any) {
    console.error("Error al eliminar producto:", error);

    if (error.number === 547) {
      set.status = 409;
      return {
        exito: false,
        mensaje: "No se puede eliminar el producto porque tiene stock o entregas asociadas",
      };
    }

    set.status = 500;
    return {
      exito: false,
      mensaje: "Error al eliminar el producto",
    };
  }
}
