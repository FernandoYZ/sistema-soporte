import path from "path";
import { fileURLToPath } from "url";
import { Eta } from "eta";
import { Elysia } from "elysia";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eta = new Eta({
  views: path.join(__dirname, "../views"),
  cache: process.env.NODE_ENV === "production",
  autoEscape: true,
  autoTrim: [false, "nl"],
});

// Plugin de Eta para ElysiaJS
export const etaPlugin = new Elysia({ name: "eta" }).derive(({ set }) => ({
  render: async (template: string, data: any = {}) => {
    const templatePath = `./${template}`;
    const html = await eta.renderAsync(templatePath, {
      ...data,
      csrfToken: data.csrfToken || "",
    });
    set.headers["Content-Type"] = "text/html; charset=utf-8";
    return html;
  },
}));
