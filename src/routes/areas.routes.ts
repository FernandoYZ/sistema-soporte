// src/routes/areas.routes.ts
import { Elysia } from "elysia";
import {
  listarAreas,
  obtenerArea,
  crearArea,
  actualizarArea,
  eliminarArea,
} from "../controllers/areas.controller";
import { renderVista } from "../utils/render";

export const areasRoutes = new Elysia()
  // API Routes
  .get("/api/areas", listarAreas)
  .get("/api/areas/:id", obtenerArea)
  .post("/api/areas", crearArea)
  .put("/api/areas/:id", actualizarArea)
  .delete("/api/areas/:id", eliminarArea)

  // View Routes
  .get("/areas", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/areas", {
      title: "Gestión de Áreas",
    });
  });
