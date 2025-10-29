import { Eta } from "eta";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const eta = new Eta({
  views: path.join(__dirname, "../views"),
  cache: process.env.NODE_ENV === "production",
  autoEscape: true,
  autoTrim: [false, "nl"],
});

export async function renderVista(template: string, data: any = {}) {
  const templatePath = `./${template}`;
  return await eta.renderAsync(templatePath, {
    ...data,
    csrfToken: data.csrfToken || "",
  });
}
