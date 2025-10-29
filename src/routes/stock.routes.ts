// src/routes/stock.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listarStockItems,
  obtenerStockItem,
  crearStockItem,
  actualizarStockItem,
  eliminarStockItem,
  listarStockCantidad,
  actualizarStockCantidad,
} from "../controllers/stock.controller";

export async function stockRoutes(app: FastifyInstance) {
  // API Routes - Stock Items (Serializados)
  app.get("/api/stock/items", listarStockItems);
  app.get("/api/stock/items/:id", obtenerStockItem);
  app.post("/api/stock/items", crearStockItem);
  app.put("/api/stock/items/:id", actualizarStockItem);
  app.delete("/api/stock/items/:id", eliminarStockItem);

  // API Routes - Stock Cantidad (No Serializados)
  app.get("/api/stock/cantidad", listarStockCantidad);
  app.put("/api/stock/cantidad/:id", actualizarStockCantidad);

  // View Routes
  app.get("/stock/items", async (_req, reply) => {
    return (reply as any).view("pages/stock-items", {
      title: "Inventario de Items Serializados",
    });
  });

  app.get("/stock/cantidad", async (_req, reply) => {
    return (reply as any).view("pages/stock-cantidad", {
      title: "Inventario por Cantidad",
    });
  });
}
