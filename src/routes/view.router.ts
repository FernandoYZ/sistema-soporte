import { Elysia } from "elysia";
import { renderVista } from "../utils/render";
import {
  listarEntregas as obtenerEntregasDB,
} from "../controllers/entregas.controller";
import {
  listarProductos as obtenerProductosDB,
} from "../controllers/productos.controller";
import {
  listarStockItems as obtenerStockDB,
} from "../controllers/stock.controller";
import {
  listarAreas as obtenerAreasDB,
} from "../controllers/areas.controller";
import {
  listarCategorias as obtenerCategoriasDB,
} from "../controllers/categorias.controller";
import {
  listarMarcas as obtenerMarcasDB,
} from "../controllers/marcas.controller";

export const vistasRutas = new Elysia()
  .get("/", async ({ set }) => {
    try {
      // Cargar todos los datos iniciales en el servidor (SSR completo)
      const [entregasRes, stockRes, productosRes, areasRes, categoriasRes, marcasRes] =
        await Promise.all([
          obtenerEntregasDB({ set }),
          obtenerStockDB({ set }),
          obtenerProductosDB({ set }),
          obtenerAreasDB({ set }),
          obtenerCategoriasDB({ set }),
          obtenerMarcasDB({ set }),
        ]);

      const entregas = entregasRes.exito ? entregasRes.datos : [];
      const stock = stockRes.exito ? stockRes.datos : [];
      const productos = productosRes.exito ? productosRes.datos : [];
      const areas = areasRes.exito ? areasRes.datos : [];
      const categorias = categoriasRes.exito ? categoriasRes.datos : [];
      const marcas = marcasRes.exito ? marcasRes.datos : [];

      // Calcular estadísticas
      const hoy = new Date().toISOString().split("T")[0];
      const stats = {
        stockDisponible: stock.filter((item: any) => item.IdEstadoStock === 1).length,
        entregasHoy: entregas.filter((e: any) => e.FechaEntrega?.startsWith(hoy)).length,
        productos: productos.length,
        areas: areas.length,
      };

      set.headers["Content-Type"] = "text/html; charset=utf-8";
      return renderVista("pages/dashboard", {
        title: "Dashboard - Sistema de Inventario",
        usuario: "Invitado",
        // Datos SSR
        entregas,
        stock,
        productos,
        areas,
        categorias,
        marcas,
        stats,
      });
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
      set.status = 500;
      return renderVista("pages/500", {
        title: "Error del Servidor",
        error: "No se pudieron cargar los datos del dashboard",
      });
    }
  });
