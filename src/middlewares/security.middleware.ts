import fastifyHelmet from "@fastify/helmet";
import fastifyCsrf from "@fastify/csrf-protection";
import type { FastifyInstance } from "fastify";

export async function configurarSeguridad(app: FastifyInstance) {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  await app.register(fastifyCsrf, {
    cookieOpts: { signed: true },
  });
}
