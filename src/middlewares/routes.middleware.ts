import type { Elysia } from "elysia";
import { vistasRutas } from "../routes/view.router";
import { areasRoutes } from "../routes/areas.routes";
import { categoriasRoutes } from "../routes/categorias.routes";
import { marcasRoutes } from "../routes/marcas.routes";
import { usuariosRoutes } from "../routes/usuarios.routes";
import { productosRoutes } from "../routes/productos.routes";
import { stockRoutes } from "../routes/stock.routes";
import { entregasRoutes } from "../routes/entregas.routes";

export function configurarRutas(app: Elysia) {
  return app
    .use(vistasRutas)
    .use(areasRoutes)
    .use(categoriasRoutes)
    .use(marcasRoutes)
    .use(usuariosRoutes)
    .use(productosRoutes)
    .use(stockRoutes)
    .use(entregasRoutes);
}