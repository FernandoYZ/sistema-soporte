// src/routes/usuarios.routes.ts
import type { FastifyInstance } from "fastify";
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../controllers/usuarios.controller";

export async function usuariosRoutes(app: FastifyInstance) {
  // API Routes
  app.get("/api/usuarios", listarUsuarios);
  app.get("/api/usuarios/:id", obtenerUsuario);
  app.post("/api/usuarios", crearUsuario);
  app.put("/api/usuarios/:id", actualizarUsuario);
  app.delete("/api/usuarios/:id", eliminarUsuario);

  // View Routes
  app.get("/usuarios", async (_req, reply) => {
    return (reply as any).view("pages/usuarios", {
      title: "Gestión de Usuarios",
    });
  });
}
