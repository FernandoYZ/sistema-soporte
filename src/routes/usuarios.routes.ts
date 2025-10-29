// src/routes/usuarios.routes.ts
import { Elysia } from "elysia";
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../controllers/usuarios.controller";
import { renderVista } from "../utils/render";

export const usuariosRoutes = new Elysia()
  // API Routes
  .get("/api/usuarios", listarUsuarios)
  .get("/api/usuarios/:id", obtenerUsuario)
  .post("/api/usuarios", crearUsuario)
  .put("/api/usuarios/:id", actualizarUsuario)
  .delete("/api/usuarios/:id", eliminarUsuario)

  // View Routes
  .get("/usuarios", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/usuarios", {
      title: "Gestión de Usuarios",
    });
  });
