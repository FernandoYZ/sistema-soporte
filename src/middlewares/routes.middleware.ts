import type { FastifyInstance } from "fastify";
import { vistasRutas } from "../routes/view.router";
import { areasRoutes } from "../routes/areas.routes";
import { categoriasRoutes } from "../routes/categorias.routes";
import { marcasRoutes } from "../routes/marcas.routes";
import { usuariosRoutes } from "../routes/usuarios.routes";
import { productosRoutes } from "../routes/productos.routes";
import { stockRoutes } from "../routes/stock.routes";
import { entregasRoutes } from "../routes/entregas.routes";

export function configurarRutas(app: FastifyInstance) {
    app.register(vistasRutas);
    app.register(areasRoutes);
    app.register(categoriasRoutes);
    app.register(marcasRoutes);
    app.register(usuariosRoutes);
    app.register(productosRoutes);
    app.register(stockRoutes);
    app.register(entregasRoutes);
}