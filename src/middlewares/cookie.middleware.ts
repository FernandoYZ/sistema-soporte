import { cookie } from "@elysiajs/cookie";
import type { Elysia } from "elysia";

export const configurarCookies = (app: Elysia) => {
  return app.use(
    cookie({
      secret: process.env.COOKIE_SECRET || "mi_clave_segura",
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    })
  );
};
