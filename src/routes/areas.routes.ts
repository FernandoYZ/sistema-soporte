// src/routes/areas.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listarAreas,
  obtenerArea,
  crearArea,
  actualizarArea,
  eliminarArea,
} from "../controllers/areas.controller";

export async function areasRoutes(app: FastifyInstance) {
  // API Routes
  app.get("/api/areas", listarAreas);
  app.get("/api/areas/:id", obtenerArea);
  app.post("/api/areas", crearArea);
  app.put("/api/areas/:id", actualizarArea);
  app.delete("/api/areas/:id", eliminarArea);

  // View Routes
  app.get("/areas", async (_req, reply) => {
    return (reply as any).view("pages/areas", {
      title: "Gestión de Áreas",
    });
  });
}
