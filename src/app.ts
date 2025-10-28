// src/app.ts
import Fastify from "fastify";
import { configurarCookies } from "./middlewares/cookie.middleware";
import { configurarSeguridad } from "./middlewares/security.middleware";
import { configurarPublic } from "./middlewares/public.middleware";
import { configurarPlantilla } from "./middlewares/plantilla.plugin";
import { configurarRutas } from "./middlewares/routes.middleware";
import { errorHandler, noEncontradoHandler } from "./handlers/error.handler";

export async function iniciarApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    }
  });

  await configurarCookies(app);
  await configurarSeguridad(app);
  await configurarPublic(app);
  await configurarPlantilla(app)

  configurarRutas(app);
  noEncontradoHandler(app);
  errorHandler(app);

  return app;
}