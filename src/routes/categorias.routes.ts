// src/routes/categorias.routes.ts
import { Elysia } from "elysia";
import {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../controllers/categorias.controller";
import { renderVista } from "../utils/render";

export const categoriasRoutes = new Elysia()
  // API Routes
  .get("/api/categorias", listarCategorias)
  .get("/api/categorias/:id", obtenerCategoria)
  .post("/api/categorias", crearCategoria)
  .put("/api/categorias/:id", actualizarCategoria)
  .delete("/api/categorias/:id", eliminarCategoria)

  // View Routes
  .get("/categorias", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/categorias", {
      title: "Gestión de Categorías",
    });
  });
