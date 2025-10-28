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
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
  },
});

// Instancias de pools (una por base de datos)
let poolSoporte: ConnectionPool | null = null;
let poolSIGH: ConnectionPool | null = null;

// Inicializa el pool de conexión a la base de datos Soporte
export const ConexionSoporte = async (fastify?: any): Promise<ConnectionPool> => {
  try {
    if (poolSoporte && poolSoporte.connected) return poolSoporte;

    const config = configuracionDB(process.env.DB_NAME_1 || "Soporte");
    const pool = new sql.ConnectionPool(config);

    // Registrar eventos de estado
    pool.on("connect", () => fastify?.log?.info("[DB Soporte] ✅ Conexión establecida"));
    pool.on("error", (err) => fastify?.log?.error({ err }, "[DB Soporte] ❌ Error de conexión"));

    await pool.connect();
    poolSoporte = pool;
    fastify?.log?.info("[DB Soporte] Pool iniciado correctamente");
    return poolSoporte;
  } catch (error) {
    fastify?.log?.error({ error }, "[DB Soporte] Error al iniciar el pool");
    throw error;
  }
};

// Inicializa el pool de conexión a la base de datos SIGH
export const ConexionSIGH = async (fastify?: any): Promise<ConnectionPool> => {
  try {
    if (poolSIGH && poolSIGH.connected) return poolSIGH;

    const config = configuracionDB(process.env.DB_NAME_2 || "SIGH");
    const pool = new sql.ConnectionPool(config);

    pool.on("connect", () => fastify?.log?.info("[DB SIGH] ✅ Conexión establecida"));
    pool.on("error", (err) => fastify?.log?.error({ err }, "[DB SIGH] ❌ Error de conexión"));

    await pool.connect();
    poolSIGH = pool;
    fastify?.log?.info("[DB SIGH] Pool iniciado correctamente");
    return poolSIGH;
  } catch (error) {
    fastify?.log?.error({ error }, "[DB SIGH] Error al iniciar el pool");
    throw error;
  }
};

// Cierra ambas conexiones (para apagar el servidor o reiniciar el pool)
export const cerrarConexiones = async (fastify?: any): Promise<void> => {
  try {
    if (poolSoporte) {
      await poolSoporte.close();
      poolSoporte = null;
      fastify?.log?.info("[DB Soporte] 🔒 Pool cerrado");
    }
    if (poolSIGH) {
      await poolSIGH.close();
      poolSIGH = null;
      fastify?.log?.info("[DB SIGH] 🔒 Pool cerrado");
    }
  } catch (error) {
    fastify?.log?.error({ error }, "[DB] Error al cerrar conexiones ❌");
    throw error;
  }
};
