// src/app.ts
import { Elysia } from "elysia";
import { configurarCookies } from "./middlewares/cookie.middleware";
import { configurarSeguridad } from "./middlewares/security.middleware";
import { configurarPublic } from "./middlewares/public.middleware";
import { middlewareMetricas } from "./middlewares/metrics.middleware";
import { configurarRutas } from "./middlewares/routes.middleware";
import { errorHandler } from "./handlers/error.handler";

export function iniciarApp() {
  const app = new Elysia();

  // Configurar plugins y middlewares
  app
    .use(middlewareMetricas)
    .use(configurarCookies)
    .use(configurarSeguridad);

  // Configurar rutas ANTES del plugin de archivos estáticos
  configurarRutas(app);

  // Configurar archivos estáticos DESPUÉS de las rutas
  app.use(configurarPublic);

  // Configurar manejo de errores
  errorHandler(app);

  return app;
}