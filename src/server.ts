import { createApp } from "./app";
import { ConexionSoporte, ConexionSIGH, cerrarConexiones } from "./config/database";

const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT || "3010", 10);

async function iniciarServidor() {
  const app = await createApp();

  try {
    // Conectar a ambas bases de datos
    await ConexionSoporte(app);
    await ConexionSIGH(app);

    // Iniciar servidor
    await app.listen({ host: HOST, port: PORT });

    app.log.info(`Servidor iniciado en http://${HOST}:${PORT}`);
  } catch (error) {
    app.log.error({ error }, "Error al iniciar el servidor");
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on("SIGINT", async () => {
  console.log("\nCerrando servidor...");
  await cerrarConexiones();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nCerrando servidor...");
  await cerrarConexiones();
  process.exit(0);
});

// Iniciar
iniciarServidor();