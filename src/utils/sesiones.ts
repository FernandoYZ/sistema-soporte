import NodeCache from "node-cache";
import { randomUUID } from "crypto";

// Cache para almacenar sesiones en memoria
// TTL de 1 hora (3600 segundos)
// checkperiod cada 10 minutos (600 segundos)
const cacheSession = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
});

export interface SessionData {
  userId: number;
  username: string;
  createdAt: number;
  lastActivity: number;
}

/**
 * Crea una nueva sesión
 * @param userId ID del usuario
 * @param username Nombre de usuario
 * @returns Token de sesión (UUID)
 */
export const crearSesion = (userId: number, username: string): string => {
  const sessionToken = randomUUID();
  const sessionData: SessionData = {
    userId,
    username,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  cacheSession.set(sessionToken, sessionData);
  return sessionToken;
};

/**
 * Obtiene los datos de una sesión
 * @param sessionToken Token de sesión
 * @returns Datos de sesión o null si no existe
 */
export const obtenerSesion = (sessionToken: string): SessionData | null => {
  const session = cacheSession.get<SessionData>(sessionToken);

  if (session) {
    // Actualizar última actividad
    session.lastActivity = Date.now();
    cacheSession.set(sessionToken, session);
    return session;
  }

  return null;
};

/**
 * Elimina una sesión
 * @param sessionToken Token de sesión
 */
export const eliminarSesion = (sessionToken: string): void => {
  cacheSession.del(sessionToken);
};

/**
 * Verifica si una sesión existe y es válida
 * @param sessionToken Token de sesión
 * @returns true si existe, false si no
 */
export const validarSesion = (sessionToken: string): boolean => {
  return cacheSession.has(sessionToken);
};

/**
 * Obtiene el número total de sesiones activas
 * @returns Número de sesiones
 */
export const contarSesiones = (): number => {
  return cacheSession.keys().length;
};