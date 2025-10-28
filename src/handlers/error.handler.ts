import type { FastifyInstance } from "fastify";

export function errorHandler(app: FastifyInstance) {
  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error({ error }, "Error interno del servidor");

    reply.status(error.statusCode || 500);
    return (reply as any).view("pages/500", {
      title: "Error del servidor",
      usuario: null,
      error: error.message,
      showDetails: process.env.NODE_ENV !== "production",
    });
  });
}

export function noEncontradoHandler(app: FastifyInstance) {
  app.setNotFoundHandler(async (_request, reply) => {
    reply.status(404);
    return (reply as any).view("pages/404", {
      title: "Página no encontrada",
      usuario: null,
    });
  });
}