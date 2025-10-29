// src/routes/productos.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../controllers/productos.controller";

export async function productosRoutes(app: FastifyInstance) {
  // API Routes
  app.get("/api/productos", listarProductos);
  app.get("/api/productos/:id", obtenerProducto);
  app.post("/api/productos", crearProducto);
  app.put("/api/productos/:id", actualizarProducto);
  app.delete("/api/productos/:id", eliminarProducto);

  // View Routes
  app.get("/productos", async (_req, reply) => {
    return (reply as any).view("pages/productos", {
      title: "Gestión de Productos",
    });
  });
}
