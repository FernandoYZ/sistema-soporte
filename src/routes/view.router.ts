import type { FastifyInstance } from "fastify";

export async function vistasRutas(app: FastifyInstance) {
  app.get("/", async (_req, reply) => {
    return (reply as any).view("pages/dashboard", {
      title: "Dashboard - Sistema de Inventario",
      usuario: "Invitado",
    });
  });
}
