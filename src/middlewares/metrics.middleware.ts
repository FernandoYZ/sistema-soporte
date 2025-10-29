import { Elysia } from "elysia";
import { obtenerContador, reiniciarContador } from "../config/database";

interface DatosMetricas {
  contadorRequests: number;
  latenciaTotal: number;
  tiempoInicio: number;
  cpuInicio: NodeJS.CpuUsage;
}

const metricas: DatosMetricas = {
  contadorRequests: 0,
  latenciaTotal: 0,
  tiempoInicio: Date.now(),
  cpuInicio: process.cpuUsage(),
};

// Función para obtener uso de memoria
function obtenerUsoMemoria() {
  const uso = process.memoryUsage();
  return {
    rss: (uso.rss / 1024 / 1024).toFixed(2), // MB
    heapUsado: (uso.heapUsed / 1024 / 1024).toFixed(2), // MB
    heapTotal: (uso.heapTotal / 1024 / 1024).toFixed(2), // MB
  };
}

// Función para obtener uso de CPU
function obtenerUsoCPU() {
  const cpuActual = process.cpuUsage(metricas.cpuInicio);
  const totalMicrosegundos = cpuActual.user + cpuActual.system;
  const tiempoTranscurrido = (Date.now() - metricas.tiempoInicio) * 1000; // convertir a microsegundos
  const porcentaje = (totalMicrosegundos / tiempoTranscurrido) * 100;
  return porcentaje.toFixed(2);
}

// Función para mostrar métricas
function mostrarMetricas() {
  const ahora = Date.now();
  const segundosTranscurridos = (ahora - metricas.tiempoInicio) / 1000;

  const memoria = obtenerUsoMemoria();
  const cpu = obtenerUsoCPU();
  const latenciaPromedio = metricas.contadorRequests > 0
    ? (metricas.latenciaTotal / metricas.contadorRequests).toFixed(2)
    : "0.00";
  const requestsPorSegundo = (metricas.contadorRequests / segundosTranscurridos).toFixed(2);
  const queries = obtenerContador();

  console.log("\n" + "=".repeat(60));
  console.log("📊 MÉTRICAS DEL SISTEMA");
  console.log("=".repeat(60));
  console.log(`⏱️  Período: ${Math.floor(segundosTranscurridos / 60)} minutos ${Math.floor(segundosTranscurridos % 60)} segundos`);
  console.log(`\n🖥️  RENDIMIENTO:`);
  console.log(`   • Requests procesados: ${metricas.contadorRequests}`);
  console.log(`   • Requests/segundo: ${requestsPorSegundo} req/s`);
  console.log(`   • Latencia promedio: ${latenciaPromedio} ms`);
  console.log(`   • Uso de CPU: ${cpu}%`);
  console.log(`\n💾 MEMORIA:`);
  console.log(`   • RSS: ${memoria.rss} MB`);
  console.log(`   • Heap usado: ${memoria.heapUsado} MB / ${memoria.heapTotal} MB`);
  console.log(`\n🗄️ BASE DE DATOS:`);
  console.log(`   • Queries ejecutadas: ${queries}`);
  console.log(`   • Queries/segundo: ${(queries / segundosTranscurridos).toFixed(2)} q/s`);
  console.log("=".repeat(60) + "\n");

  // Resetear contadores para el siguiente período
  metricas.contadorRequests = 0;
  metricas.latenciaTotal = 0;
  metricas.tiempoInicio = Date.now();
  metricas.cpuInicio = process.cpuUsage();
  reiniciarContador();
}

// Middleware de métricas
export const middlewareMetricas = new Elysia({ name: "metricas" })
  .derive(() => {
    const tiempoInicio = Date.now();

    return {
      alCompletarRespuesta: () => {
        const latencia = Date.now() - tiempoInicio;
        metricas.contadorRequests++;
        metricas.latenciaTotal += latencia;
      }
    };
  })
  .onAfterHandle(({ alCompletarRespuesta }) => {
    if (alCompletarRespuesta) {
      alCompletarRespuesta();
    }
  });

// Iniciar el intervalo de reporte cada 5 minutos
export function iniciarReporteMetricas() {
  const CINCO_MINUTOS = 5 * 60 * 1000;

  setInterval(() => {
    mostrarMetricas();
  }, CINCO_MINUTOS);

  console.log("[ME] 📊 Reporte de métricas iniciado");
}
