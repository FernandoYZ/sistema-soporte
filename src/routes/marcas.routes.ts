// src/routes/marcas.routes.ts
import { Elysia } from "elysia";
import {
  listarMarcas,
  obtenerMarca,
  crearMarca,
  actualizarMarca,
  eliminarMarca,
} from "../controllers/marcas.controller";
import { renderVista } from "../utils/render";

export const marcasRoutes = new Elysia()
  // API Routes
  .get("/api/marcas", listarMarcas)
  .get("/api/marcas/:id", obtenerMarca)
  .post("/api/marcas", crearMarca)
  .put("/api/marcas/:id", actualizarMarca)
  .delete("/api/marcas/:id", eliminarMarca)

  // View Routes
  .get("/marcas", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/marcas", {
      title: "Gestión de Marcas",
    });
  });
