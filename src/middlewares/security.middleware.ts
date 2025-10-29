import helmet from "helmet";
import type { Elysia } from "elysia";

export const configurarSeguridad = (app: Elysia) => {
  // Middleware de Helmet para headers de seguridad
  return app.onRequest(({ request, set }) => {
    // Aplicar Helmet manualmente a través de headers
    const helmetHeaders = helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    });

    // Aplicar headers de seguridad básicos
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  });
};
