import { Elysia } from "elysia";
import { renderVista } from "../utils/render";

export const vistasRutas = new Elysia()
  .get("/", async ({ set }) => {
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return renderVista("pages/dashboard", {
      title: "Dashboard - Sistema de Inventario",
      usuario: "Invitado",
    });
  });
