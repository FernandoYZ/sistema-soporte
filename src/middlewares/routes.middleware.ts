import type { FastifyInstance } from "fastify";
import { vistasRutas } from "../routes/view.router";

export function configurarRutas(app: FastifyInstance) {
    app.register(vistasRutas)
}