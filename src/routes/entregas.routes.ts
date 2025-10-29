// src/routes/entregas.routes.ts
import { Elysia } from "elysia";
import {
  listarEntregas,
  obtenerEntrega,
  crearEntrega,
  eliminarEntrega,
} from "../controllers/entregas.controller";
import { renderVista } from "../utils/render";

export const entregasRoutes = new Elysia()
  // API Routes
  .get("/api/entregas", listarEntregas)
  .get("/api/entregas/:id", obtenerEntrega)
  .post("/api/entregas", crearEntrega)
  .delete("/api/entregas/:id", eliminarEntrega)

  // View Routes
  .get("/entregas", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/entregas", {
      title: "Gestión de Entregas",
    });
  })

  .get("/entregas/nueva", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/nueva-entrega", {
      title: "Nueva Entrega",
    });
  });
