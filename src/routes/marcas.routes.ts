// src/routes/marcas.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listarMarcas,
  obtenerMarca,
  crearMarca,
  actualizarMarca,
  eliminarMarca,
} from "../controllers/marcas.controller";

export async function marcasRoutes(app: FastifyInstance) {
  // API Routes
  app.get("/api/marcas", listarMarcas);
  app.get("/api/marcas/:id", obtenerMarca);
  app.post("/api/marcas", crearMarca);
  app.put("/api/marcas/:id", actualizarMarca);
  app.delete("/api/marcas/:id", eliminarMarca);

  // View Routes
  app.get("/marcas", async (_req, reply) => {
    return (reply as any).view("pages/marcas", {
      title: "Gestión de Marcas",
    });
  });
}
