/**
 * Formatea una fecha a formato local español
 * @param date Fecha a formatear
 * @returns Fecha formateada como string
 */
export const formatearFecha = (date: Date): string => {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Formatea una fecha solo con día/mes/año
 * @param date Fecha a formatear
 * @returns Fecha formateada como string
 */
export const formatearFechaCorta = (date: Date): string => {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

/**
 * Valida si un string es un email válido
 * @param email Email a validar
 * @returns true si es válido, false si no
 */
export const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Sanitiza un string para evitar XSS básico
 * @param str String a sanitizar
 * @returns String sanitizado
 */
export const sanitizarString = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};