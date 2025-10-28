import type { FastifyInstance } from "fastify";

export async function vistasRutas(app: FastifyInstance) {
  app.get("/", async (_req, reply) => {
    return (reply as any).view("pages/inicio", {
      title: "Inicio",
      usuario: "Invitado",
    });
  });
}
