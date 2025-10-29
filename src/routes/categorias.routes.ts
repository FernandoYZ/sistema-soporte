// src/routes/categorias.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../controllers/categorias.controller";

export async function categoriasRoutes(app: FastifyInstance) {
  // API Routes
  app.get("/api/categorias", listarCategorias);
  app.get("/api/categorias/:id", obtenerCategoria);
  app.post("/api/categorias", crearCategoria);
  app.put("/api/categorias/:id", actualizarCategoria);
  app.delete("/api/categorias/:id", eliminarCategoria);

  // View Routes
  app.get("/categorias", async (_req, reply) => {
    return (reply as any).view("pages/categorias", {
      title: "Gestión de Categorías",
    });
  });
}
