// refresh-manager.js - Gestor de actualizaciones inteligentes
// Sistema de refresh reactivo sin polling constante
// Usa Page Visibility API + Idle Detection para minimizar carga del servidor

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN
  // ============================================
  const CONFIGURACION = {
    tiempoInactividad: 5 * 60 * 1000, // 5 minutos en milisegundos
    habilitarLogs: true, // Cambiar a false en producción
  };

  // ============================================
  // ESTADO GLOBAL
  // ============================================
  const estado = {
    temporizadorInactividad: null,
    ultimaActividad: Date.now(),
    pestanaVisible: !document.hidden,
    refrescosPendientes: new Set(),
  };

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Logger condicional para debugging
   */
  function log(mensaje, datos = null) {
    if (CONFIGURACION.habilitarLogs) {
      const timestamp = new Date().toLocaleTimeString('es-ES');
      console.log(`[Refresh Manager ${timestamp}] ${mensaje}`, datos || '');
    }
  }

  /**
   * Dispara un evento personalizado en el body
   * @param {string} nombreEvento - Nombre del evento a disparar
   */
  function dispararEvento(nombreEvento) {
    log(`Disparando evento: ${nombreEvento}`);
    document.body.dispatchEvent(new CustomEvent(nombreEvento, {
      bubbles: true,
      detail: { timestamp: Date.now() }
    }));
  }

  /**
   * Ejecuta refresh usando HTMX en un elemento específico
   * @param {string} selector - Selector CSS del elemento
   */
  function refrescarElemento(selector) {
    const elemento = document.querySelector(selector);
    if (elemento && typeof htmx !== 'undefined') {
      log(`Refrescando elemento: ${selector}`);
      htmx.trigger(elemento, 'refresh');
    } else {
      log(`⚠️ No se encontró elemento o HTMX no disponible: ${selector}`);
    }
  }

  // ============================================
  // PAGE VISIBILITY API
  // ============================================

  /**
   * Maneja el cambio de visibilidad de la pestaña
   * Cuando el usuario vuelve, refresca las secciones principales
   */
  function manejarCambioVisibilidad() {
    if (document.hidden) {
      // Pestaña oculta
      estado.pestanaVisible = false;
      log('📴 Pestaña oculta - pausando actualizaciones');

      // Marcar secciones para refresh cuando vuelva
      estado.refrescosPendientes.add('stats');
      estado.refrescosPendientes.add('entregas');
      estado.refrescosPendientes.add('stock');
      estado.refrescosPendientes.add('productos');

    } else {
      // Pestaña visible de nuevo
      estado.pestanaVisible = true;
      const tiempoInactivo = Date.now() - estado.ultimaActividad;

      log(`📱 Pestaña visible - tiempo inactivo: ${Math.round(tiempoInactivo / 1000)}s`);

      // Solo refrescar si estuvo oculta más de 30 segundos
      if (tiempoInactivo > 30000) {
        ejecutarRefrescosPendientes();
      }

      estado.ultimaActividad = Date.now();
    }
  }

  /**
   * Ejecuta todos los refrescos pendientes acumulados
   */
  function ejecutarRefrescosPendientes() {
    if (estado.refrescosPendientes.size === 0) {
      log('✅ No hay refrescos pendientes');
      return;
    }

    log(`🔄 Ejecutando ${estado.refrescosPendientes.size} refrescos pendientes`);

    estado.refrescosPendientes.forEach(seccion => {
      dispararEvento(`refresh-${seccion}`);
    });

    estado.refrescosPendientes.clear();
  }

  // ============================================
  // IDLE DETECTION
  // ============================================

  /**
   * Resetea el temporizador de inactividad
   * Se llama en cada interacción del usuario
   */
  function reiniciarTemporizadorInactividad() {
    clearTimeout(estado.temporizadorInactividad);
    estado.ultimaActividad = Date.now();

    estado.temporizadorInactividad = setTimeout(() => {
      manejarInactividad();
    }, CONFIGURACION.tiempoInactividad);
  }

  /**
   * Se ejecuta cuando el usuario está inactivo por el tiempo configurado
   * Refresca solo las estadísticas (lightweight)
   */
  function manejarInactividad() {
    if (!estado.pestanaVisible) {
      log('😴 Usuario inactivo pero pestaña oculta - skip refresh');
      return;
    }

    log(`⏱️ Usuario inactivo por ${CONFIGURACION.tiempoInactividad / 60000} minutos`);

    // Solo refrescar stats (1 query ligera)
    dispararEvento('refresh-stats');

    // Reiniciar timer para próxima inactividad
    reiniciarTemporizadorInactividad();
  }

  /**
   * Configura los listeners de actividad del usuario
   */
  function configurarDeteccionActividad() {
    const eventosActividad = [
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    eventosActividad.forEach(evento => {
      document.addEventListener(evento, reiniciarTemporizadorInactividad, {
        passive: true,
        capture: true
      });
    });

    log('✅ Detección de actividad configurada');
  }

  // ============================================
  // REFRESH POST-ACCIÓN
  // ============================================

  /**
   * Refresca múltiples secciones después de una acción CRUD
   * @param {Array<string>} secciones - Lista de secciones a refrescar
   */
  function refrescarDespuesDeAccion(secciones = []) {
    log('🎯 Refresh post-acción', secciones);

    secciones.forEach(seccion => {
      dispararEvento(`refresh-${seccion}`);
    });
  }

  /**
   * Escucha eventos HTMX globales para refrescos automáticos
   */
  function configurarRefreshAutomatico() {
    // Después de cualquier POST exitoso
    document.body.addEventListener('htmx:afterRequest', (evento) => {
      const xhr = evento.detail.xhr;

      // Solo procesar requests exitosos
      if (xhr.status >= 200 && xhr.status < 300) {
        const metodo = evento.detail.requestConfig.verb;
        const url = evento.detail.requestConfig.path;

        // Determinar qué refrescar según la URL
        if (metodo === 'POST' || metodo === 'PUT' || metodo === 'DELETE') {
          log(`✅ ${metodo} exitoso en ${url}`);

          // Siempre refrescar stats después de cambios
          dispararEvento('refresh-stats');

          // Refrescar sección específica según endpoint
          if (url.includes('/entregas')) {
            dispararEvento('refresh-entregas');
          } else if (url.includes('/stock')) {
            dispararEvento('refresh-stock');
          } else if (url.includes('/productos')) {
            dispararEvento('refresh-productos');
          } else if (url.includes('/areas')) {
            dispararEvento('refresh-areas');
          } else if (url.includes('/categorias')) {
            dispararEvento('refresh-categorias');
          } else if (url.includes('/marcas')) {
            dispararEvento('refresh-marcas');
          }
        }
      }
    });

    log('✅ Refresh automático configurado');
  }

  // ============================================
  // INDICADORES VISUALES
  // ============================================

  /**
   * Agrega indicadores visuales durante las peticiones HTMX
   */
  function configurarIndicadoresVisuales() {
    // Agregar clase durante request
    document.body.addEventListener('htmx:beforeRequest', () => {
      document.body.classList.add('htmx-cargando');
    });

    // Remover clase después del request
    document.body.addEventListener('htmx:afterRequest', () => {
      document.body.classList.remove('htmx-cargando');
    });

    // Manejar errores
    document.body.addEventListener('htmx:responseError', (evento) => {
      console.error('Error en request HTMX:', evento.detail);
      // Aquí puedes mostrar un toast o notificación
    });

    log('✅ Indicadores visuales configurados');
  }

  // ============================================
  // API PÚBLICA
  // ============================================

  /**
   * API pública expuesta globalmente
   */
  window.GestorRefresh = {
    // Métodos públicos
    refrescarSeccion: dispararEvento,
    refrescarElemento: refrescarElemento,
    refrescarDespuesDeAccion: refrescarDespuesDeAccion,

    // Estado (solo lectura)
    obtenerEstado: () => ({
      pestanaVisible: estado.pestanaVisible,
      ultimaActividad: new Date(estado.ultimaActividad).toLocaleTimeString('es-ES'),
      refrescosPendientes: Array.from(estado.refrescosPendientes)
    }),

    // Configuración
    establecerTiempoInactividad: (milisegundos) => {
      CONFIGURACION.tiempoInactividad = milisegundos;
      log(`⚙️ Tiempo de inactividad actualizado: ${milisegundos}ms`);
      reiniciarTemporizadorInactividad();
    },

    habilitarLogs: (habilitar) => {
      CONFIGURACION.habilitarLogs = habilitar;
    }
  };

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  /**
   * Inicializa el gestor de refresh
   */
  function inicializar() {
    log('🚀 Inicializando Gestor de Refresh');

    // Configurar Page Visibility API
    document.addEventListener('visibilitychange', manejarCambioVisibilidad);

    // Configurar detección de actividad
    configurarDeteccionActividad();

    // Iniciar temporizador de inactividad
    reiniciarTemporizadorInactividad();

    // Configurar refresh automático post-acciones
    configurarRefreshAutomatico();

    // Configurar indicadores visuales
    configurarIndicadoresVisuales();

    log('✅ Gestor de Refresh inicializado correctamente');
    log(`📊 Configuración:`, {
      tiempoInactividad: `${CONFIGURACION.tiempoInactividad / 60000} minutos`,
      logsHabilitados: CONFIGURACION.habilitarLogs
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }

})();
