import Fastify from "fastify";
import path from "path";
import { fileURLToPath } from "url";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import fastifyCsrf from "@fastify/csrf-protection";
import { Eta } from "eta";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = Fastify({
    logger: true,
  });

  // Configurar Eta
  const eta = new Eta({
    views: path.join(__dirname, "views"),
    cache: false,
    autoEscape: true,
    autoTrim: [false, "nl"],
  });

  // Registrar plugins de seguridad
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || "mi_clave_segura",
    parseOptions: {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    },
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  await app.register(fastifyCsrf, {
    cookieOpts: { signed: true },
  });

  // Servir archivos estáticos
  await app.register(import("@fastify/static"), {
    root: path.join(__dirname, "..", "public"),
    prefix: "/public/",
  });

  // Helper para renderizar vistas con Eta
  app.decorateReply("view", async function (template: string, data: any = {}) {
    const templatePath = `./${template}`;
    const html = await eta.renderAsync(templatePath, {
      ...data,
      csrfToken: (this as any).generateCsrf?.() || "",
    });
    this.type("text/html").send(html);
  });

  // Ruta de prueba
  app.get("/", async (_request, reply) => {
    return (reply as any).view("pages/inicio", {
      title: "Inicio",
      usuario: "Invitado",
    });
  });

  // Manejador de errores 404 (Not Found)
  app.setNotFoundHandler(async (_request, reply) => {
    reply.status(404);
    return (reply as any).view("pages/404", {
      title: "Página no encontrada",
      usuario: null,
    });
  });

  // Manejador de errores 500 (Internal Server Error)
  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error({ error }, "Error interno del servidor");

    reply.status(error.statusCode || 500);
    return (reply as any).view("pages/500", {
      title: "Error del servidor",
      usuario: null,
      error: error.message,
      showDetails: process.env.NODE_ENV !== "production",
    });
  });

  return app;
}