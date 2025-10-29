import type { FastifyInstance } from "fastify";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function configurarPublic(app: FastifyInstance) {
  await app.register(import("@fastify/static"), {
    root: path.join(__dirname, "../../public"),
    prefix: "/",
  });
}
