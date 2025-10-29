// src/routes/entregas.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listarEntregas,
  obtenerEntrega,
  crearEntrega,
  eliminarEntrega,
} from "../controllers/entregas.controller";

export async function entregasRoutes(app: FastifyInstance) {
  // API Routes
  app.get("/api/entregas", listarEntregas);
  app.get("/api/entregas/:id", obtenerEntrega);
  app.post("/api/entregas", crearEntrega);
  app.delete("/api/entregas/:id", eliminarEntrega);

  // View Routes
  app.get("/entregas", async (_req, reply) => {
    return (reply as any).view("pages/entregas", {
      title: "Gestión de Entregas",
    });
  });

  app.get("/entregas/nueva", async (_req, reply) => {
    return (reply as any).view("pages/nueva-entrega", {
      title: "Nueva Entrega",
    });
  });
}
