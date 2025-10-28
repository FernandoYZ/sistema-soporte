import path from "path";
import { fileURLToPath } from "url";
import { Eta } from "eta";
import type { FastifyInstance } from "fastify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function configurarPlantilla(app: FastifyInstance) {
  const eta = new Eta({
    views: path.join(__dirname, "../views"),
    cache: false,
    autoEscape: true,
    autoTrim: [false, "nl"],
  });

  app.decorateReply("view", async function (template: string, data: any = {}) {
    const templatePath = `./${template}`;
    const html = await eta.renderAsync(templatePath, {
      ...data,
      csrfToken: (this as any).generateCsrf?.() || "",
    });
    this.type("text/html").send(html);
  });
}
