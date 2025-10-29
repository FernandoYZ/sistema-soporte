// src/routes/productos.routes.ts
import { Elysia } from "elysia";
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../controllers/productos.controller";
import { renderVista } from "../utils/render";

export const productosRoutes = new Elysia()
  // API Routes
  .get("/api/productos", listarProductos)
  .get("/api/productos/:id", obtenerProducto)
  .post("/api/productos", crearProducto)
  .put("/api/productos/:id", actualizarProducto)
  .delete("/api/productos/:id", eliminarProducto)

  // View Routes
  .get("/productos", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/productos", {
      title: "Gestión de Productos",
    });
  });
