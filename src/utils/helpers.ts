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

/**
 * Obtiene el badge HTML de estado para stock
 * @param idEstado ID del estado (1=En Almacén, 2=Entregado, etc)
 * @param nombreEstado Nombre del estado
 * @returns HTML del badge con clases Tailwind
 */
export const obtenerBadgeEstado = (idEstado: number, nombreEstado: string): string => {
  const clases = {
    1: 'bg-green-500/10 text-green-400 border-green-500/20', // En Almacén
    2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     // Entregado
    3: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', // Mantenimiento
    4: 'bg-red-500/10 text-red-400 border-red-500/20'         // Dado de Baja
  };

  const clase = clases[idEstado as keyof typeof clases] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return `<span class="badge border ${clase}">${nombreEstado || 'Desconocido'}</span>`;
};