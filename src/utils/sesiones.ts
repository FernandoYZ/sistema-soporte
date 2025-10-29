import NodeCache from "node-cache";
import { randomUUID } from "crypto";
import type { Sesion } from "../types/sesiones.type";

// Cache para almacenar sesiones en memoria
// TTL de 1 hora (3600 segundos)
// checkperiod cada 10 minutos (600 segundos)
const cacheSesion = new NodeCache({
  stdTTL: 3600,
  checkperiod: 600,
});

export const crearSesion = (idUsuario: number, usuario: string): string => {
  const sesionToken = randomUUID();
  const sesion: Sesion = {
    idUsuario,
    usuario,
    creadoEn: Date.now(),
    ultimaActividad: Date.now(),
    expiraEn: Date.now() + 3600000, // 1 hora
  };

  cacheSesion.set(sesionToken, sesion);
  return sesionToken;
};

export const obtenerSesion = (sesionToken: string): Sesion | null => {
  const sesion = cacheSesion.get<Sesion>(sesionToken);

  if (sesion) {
    // Actualizar última actividad
    sesion.ultimaActividad = Date.now();
    cacheSesion.set(sesionToken, sesion);
    return sesion;
  }

  return null;
};

export const eliminarSesion = (sesionToken: string): void => {
  cacheSesion.del(sesionToken);
};

export const validarSesion = (sesionToken: string): boolean => {
  return cacheSesion.has(sesionToken);
};

export const contarSesiones = (): number => {
  return cacheSesion.keys().length;
};