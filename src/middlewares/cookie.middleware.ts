import fastifyCookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";

export async function configurarCookies(app: FastifyInstance) {
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "mi_clave_segura",
    parseOptions: {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    },
  });
}
