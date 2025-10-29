import { staticPlugin } from "@elysiajs/static";
import type { Elysia } from "elysia";

export const configurarPublic = (app: Elysia) => {
  return app.use(
    staticPlugin({
      assets: "public",
      prefix: ""
    })
  );
};
