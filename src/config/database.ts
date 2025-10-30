import sql, { ConnectionPool } from "mssql";
import type { config as SQLConfig } from "mssql";

// Opciones comunes para ambas conexiones
const opciones: SQLConfig["options"] = {
  encrypt: false,
  trustServerCertificate: true,
  enableArithAbort: true,
};

const configuracionDB = (database: string): SQLConfig => ({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST || "localhost",
  database,
  options: opciones,
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
});

// Instancias de pools (una por base de datos)
let poolSoporte: ConnectionPool | null = null;
let poolSIGH: ConnectionPool | null = null;

// Inicializa el pool de conexión a la base de datos Soporte
export const ConexionSoporte = async (): Promise<ConnectionPool> => {
  try {
    if (poolSoporte && poolSoporte.connected) return poolSoporte;

    const config = configuracionDB(process.env.DB_NAME_1 || "Soporte");
    poolSoporte = new sql.ConnectionPool(config);

    // Registrar eventos de estado
    poolSoporte.on("connect", () => console.log("[DB Soporte] ✅ Conexión establecida"));
    poolSoporte.on("error", (err) => console.error("[DB Soporte] ❌ Error de conexión:", err));

    await poolSoporte.connect();
    console.log(`[DB] ✅ ${process.env.DB_NAME_1 || "Soporte"} iniciado correctamente`);
    return poolSoporte;
  } catch (error) {
    console.error("[DB Soporte] Error al iniciar el pool:", error);
    throw error;
  }
};

// Inicializa el pool de conexión a la base de datos SIGH
export const ConexionSIGH = async (): Promise<ConnectionPool> => {
  try {
    if (poolSIGH && poolSIGH.connected) return poolSIGH;

    const config = configuracionDB(process.env.DB_NAME_2 || "SIGH");
    poolSIGH = new sql.ConnectionPool(config);

    poolSIGH.on("connect", () => console.log("[DB SIGH] ✅ Conexión establecida"));
    poolSIGH.on("error", (err) => console.error("[DB SIGH] ❌ Error de conexión:", err));

    await poolSIGH.connect();
    console.log(`[DB] ✅ ${process.env.DB_NAME_2 || "SIGH"} iniciado correctamente`);
    return poolSIGH;
  } catch (error) {
    console.error("[DB SIGH] Error al iniciar el pool:", error);
    throw error;
  }
};

// Cierra ambas conexiones (para apagar el servidor o reiniciar el pool)
export const cerrarConexiones = async (): Promise<void> => {
  try {
    if (poolSoporte) {
      await poolSoporte.close();
      poolSoporte = null;
      console.log("[DB Soporte] 🔒 Pool cerrado");
    }
    if (poolSIGH) {
      await poolSIGH.close();
      poolSIGH = null;
      console.log("[DB SIGH] 🔒 Pool cerrado");
    }
  } catch (error) {
    console.error("[DB] Error al cerrar conexiones ❌:", error);
    throw error;
  }
};
