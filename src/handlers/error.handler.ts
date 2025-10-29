import { Elysia } from "elysia";
import { renderVista } from "../utils/render";

export const errorHandler = (app: Elysia) => {
  return app.onError(async ({ code, error, set, request }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";

    if (code === "NOT_FOUND") {
      // Log simple para 404s (sin saturar la terminal)
      const url = new URL(request.url);
      console.log(`[404] Página no encontrada: ${url.pathname}`);

      set.status = 404;
      return renderVista("pages/404", {
        title: "Página no encontrada",
        usuario: null,
      });
    }

    // Solo mostrar error completo para errores 500
    console.error("Error del servidor:", error);

    set.status = 500;
    return renderVista("pages/500", {
      title: "Error del servidor",
      usuario: null,
      error: 'message' in error ? error.message : 'Unknown error',
      showDetails: process.env.NODE_ENV !== "production",
    });
  });
};