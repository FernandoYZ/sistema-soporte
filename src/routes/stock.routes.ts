// src/routes/stock.routes.ts
import { Elysia } from "elysia";
import {
  listarStockItems,
  obtenerStockItem,
  crearStockItem,
  actualizarStockItem,
  eliminarStockItem,
  listarStockCantidad,
  actualizarStockCantidad,
} from "../controllers/stock.controller";
import { renderVista } from "../utils/render";

export const stockRoutes = new Elysia()
  // API Routes - Stock Items (Serializados)
  .get("/api/stock/items", listarStockItems)
  .get("/api/stock/items/:id", obtenerStockItem)
  .post("/api/stock/items", crearStockItem)
  .put("/api/stock/items/:id", actualizarStockItem)
  .delete("/api/stock/items/:id", eliminarStockItem)

  // API Routes - Stock Cantidad (No Serializados)
  .get("/api/stock/cantidad", listarStockCantidad)
  .put("/api/stock/cantidad/:id", actualizarStockCantidad)

  // View Routes
  .get("/stock/items", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/stock-items", {
      title: "Inventario de Items Serializados",
    });
  })

  .get("/stock/cantidad", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/stock-cantidad", {
      title: "Inventario por Cantidad",
    });
  });
