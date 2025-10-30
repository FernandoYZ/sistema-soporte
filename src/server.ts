import { iniciarApp } from "./app";
import { ConexionSoporte, ConexionSIGH, cerrarConexiones } from "./config/database";

const HOST = process.env.HOST || "localhost";
const PORT = parseInt(process.env.PORT || "3000", 10);
const ENTORNO = process.env.NODE_ENV || "development";

async function iniciarServidor() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("⚙️  INICIANDO SISTEMA DE SOPORTE REZOLA");
    console.log("=".repeat(60));

    // Conectar a ambas bases de datos
    await ConexionSoporte();
    await ConexionSIGH();

    // Iniciar aplicación
    const app = iniciarApp();

    // Iniciar servidor
    app.listen({
      hostname: HOST,
      port: PORT
    }, 
      () => {
      console.log("\n" + "=".repeat(60));
      console.log("🚀 SERVIDOR INICIADO CORRECTAMENTE");
      console.log("=".repeat(60));
      console.log(` • URL:        http://${HOST}:${PORT}`);
      console.log(` • Entorno:    ${ENTORNO}`);
      console.log(` • Runtime:    Bun ${Bun.version}`);
      console.log(` • Framework:  ElysiaJS`);
      console.log("=".repeat(60) + "\n");
      console.log("💡 Presiona Ctrl+C para detener el servidor\n");
    });
  } catch (error) {
    console.error("\n❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on("SIGINT", async () => {
  console.log("\n🔌 Cerrando servidor...");
  await cerrarConexiones();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🔌 Cerrando servidor...");
  await cerrarConexiones();
  process.exit(0);
});

// Iniciar
iniciarServidor();