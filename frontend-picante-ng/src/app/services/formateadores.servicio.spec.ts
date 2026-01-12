/**
 * Tests Unitarios - FormateadoresServicio
 * Suite completa de pruebas para el servicio de formateo
 * 
 * @autor Equipo El Picante
 */
import { TestBed } from '@angular/core/testing';
import { FormateadoresServicio } from './formateadores.servicio';

describe('FormateadoresServicio', () => {
  let servicio: FormateadoresServicio;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormateadoresServicio]
    });
    servicio = TestBed.inject(FormateadoresServicio);
  });

  it('debería crearse correctamente', () => {
    expect(servicio).toBeTruthy();
  });

  // ===== TESTS: formatearMoneda =====
  describe('formatearMoneda', () => {
    it('debería formatear números con símbolo de soles', () => {
      expect(servicio.formatearMoneda(100)).toBe('S/. 100.00');
      expect(servicio.formatearMoneda(25.5)).toBe('S/. 25.50');
      expect(servicio.formatearMoneda(0.99)).toBe('S/. 0.99');
    });

    it('debería manejar valor cero', () => {
      expect(servicio.formatearMoneda(0)).toBe('S/. 0.00');
    });

    it('debería manejar valores nulos o undefined', () => {
      expect(servicio.formatearMoneda(null)).toBe('S/. 0.00');
      expect(servicio.formatearMoneda(undefined)).toBe('S/. 0.00');
    });

    it('debería redondear a 2 decimales', () => {
      expect(servicio.formatearMoneda(10.999)).toBe('S/. 11.00');
      expect(servicio.formatearMoneda(10.994)).toBe('S/. 10.99');
    });
  });

  // ===== TESTS: formatearFecha =====
  describe('formatearFecha', () => {
    it('debería formatear fecha en formato peruano DD/MM/YYYY', () => {
      const fecha = new Date(2024, 0, 15); // 15 de enero 2024
      expect(servicio.formatearFecha(fecha)).toBe('15/01/2024');
    });

    it('debería formatear string de fecha ISO', () => {
      const resultado = servicio.formatearFecha('2024-06-20T10:30:00');
      expect(resultado).toBe('20/06/2024');
    });

    it('debería retornar "-" para fechas nulas', () => {
      expect(servicio.formatearFecha(null)).toBe('-');
      expect(servicio.formatearFecha(undefined)).toBe('-');
    });

    it('debería agregar ceros a la izquierda en días y meses', () => {
      const fecha = new Date(2024, 5, 5); // 5 de junio 2024
      expect(servicio.formatearFecha(fecha)).toBe('05/06/2024');
    });
  });

  // ===== TESTS: formatearFechaHora =====
  describe('formatearFechaHora', () => {
    it('debería formatear fecha y hora correctamente', () => {
      const fecha = new Date(2024, 0, 15, 14, 30); // 15 enero 2024, 14:30
      expect(servicio.formatearFechaHora(fecha)).toBe('15/01/2024 14:30');
    });

    it('debería agregar ceros a horas y minutos', () => {
      const fecha = new Date(2024, 0, 15, 9, 5);
      expect(servicio.formatearFechaHora(fecha)).toBe('15/01/2024 09:05');
    });

    it('debería retornar "-" para fechas nulas', () => {
      expect(servicio.formatearFechaHora(null)).toBe('-');
    });
  });

  // ===== TESTS: calcularTiempoTranscurrido =====
  describe('calcularTiempoTranscurrido', () => {
    it('debería calcular minutos transcurridos', () => {
      const hace10min = new Date(Date.now() - 10 * 60 * 1000);
      const resultado = servicio.calcularTiempoTranscurrido(hace10min);
      expect(resultado).toContain('min');
    });

    it('debería mostrar horas cuando supera 60 minutos', () => {
      const hace90min = new Date(Date.now() - 90 * 60 * 1000);
      const resultado = servicio.calcularTiempoTranscurrido(hace90min);
      expect(resultado).toContain('h');
      expect(resultado).toContain('30min');
    });

    it('debería retornar "-" para fecha nula', () => {
      expect(servicio.calcularTiempoTranscurrido(null)).toBe('-');
    });
  });

  // ===== TESTS: traducirEstadoMesa =====
  describe('traducirEstadoMesa', () => {
    it('debería traducir AVAILABLE a Disponible', () => {
      expect(servicio.traducirEstadoMesa('AVAILABLE')).toBe('Disponible');
    });

    it('debería traducir OCCUPIED a Ocupada', () => {
      expect(servicio.traducirEstadoMesa('OCCUPIED')).toBe('Ocupada');
    });

    it('debería traducir WAITING_PAYMENT a Esperando Pago', () => {
      expect(servicio.traducirEstadoMesa('WAITING_PAYMENT')).toBe('Esperando Pago');
    });

    it('debería traducir READY a Lista para Servir', () => {
      expect(servicio.traducirEstadoMesa('READY')).toBe('Lista para Servir');
    });

    it('debería retornar el estado original si no tiene traducción', () => {
      expect(servicio.traducirEstadoMesa('ESTADO_DESCONOCIDO')).toBe('ESTADO_DESCONOCIDO');
    });
  });

  // ===== TESTS: traducirEstadoPedido =====
  describe('traducirEstadoPedido', () => {
    it('debería traducir OPEN a Abierto', () => {
      expect(servicio.traducirEstadoPedido('OPEN')).toBe('Abierto');
    });

    it('debería traducir PAID a Pagado', () => {
      expect(servicio.traducirEstadoPedido('PAID')).toBe('Pagado');
    });

    it('debería traducir PREPARING a En Preparación', () => {
      expect(servicio.traducirEstadoPedido('PREPARING')).toBe('En Preparación');
    });

    it('debería traducir CANCELLED a Cancelado', () => {
      expect(servicio.traducirEstadoPedido('CANCELLED')).toBe('Cancelado');
    });
  });

  // ===== TESTS: obtenerClaseEstadoMesa =====
  describe('obtenerClaseEstadoMesa', () => {
    it('debería retornar bg-secondary para AVAILABLE', () => {
      expect(servicio.obtenerClaseEstadoMesa('AVAILABLE')).toBe('bg-secondary');
    });

    it('debería retornar bg-warning para OCCUPIED', () => {
      expect(servicio.obtenerClaseEstadoMesa('OCCUPIED')).toBe('bg-warning text-dark');
    });

    it('debería retornar bg-danger para WAITING_PAYMENT', () => {
      expect(servicio.obtenerClaseEstadoMesa('WAITING_PAYMENT')).toBe('bg-danger');
    });

    it('debería retornar bg-success para READY', () => {
      expect(servicio.obtenerClaseEstadoMesa('READY')).toBe('bg-success');
    });

    it('debería retornar bg-secondary para estados desconocidos', () => {
      expect(servicio.obtenerClaseEstadoMesa('ESTADO_DESCONOCIDO')).toBe('bg-secondary');
    });
  });

  // ===== TESTS: truncarTexto =====
  describe('truncarTexto', () => {
    it('debería truncar texto largo con puntos suspensivos', () => {
      const textoLargo = 'Este es un texto muy largo que debería ser truncado';
      const resultado = servicio.truncarTexto(textoLargo, 20);
      expect(resultado).toBe('Este es un texto muy...');
      expect(resultado.length).toBeLessThanOrEqual(23); // 20 + "..."
    });

    it('debería retornar texto completo si es menor al límite', () => {
      const textoCorto = 'Texto corto';
      expect(servicio.truncarTexto(textoCorto, 50)).toBe('Texto corto');
    });

    it('debería usar límite por defecto de 50 caracteres', () => {
      const texto = 'a'.repeat(60);
      const resultado = servicio.truncarTexto(texto);
      expect(resultado.length).toBe(53); // 50 + "..."
    });

    it('debería retornar cadena vacía para valores nulos', () => {
      expect(servicio.truncarTexto(null)).toBe('');
      expect(servicio.truncarTexto(undefined)).toBe('');
    });
  });

  // ===== TESTS: capitalizar =====
  describe('capitalizar', () => {
    it('debería capitalizar primera letra de cada palabra', () => {
      expect(servicio.capitalizar('hola mundo')).toBe('Hola Mundo');
    });

    it('debería convertir mayúsculas a minúsculas excepto iniciales', () => {
      expect(servicio.capitalizar('HOLA MUNDO')).toBe('Hola Mundo');
    });

    it('debería manejar una sola palabra', () => {
      expect(servicio.capitalizar('palabra')).toBe('Palabra');
    });

    it('debería retornar cadena vacía para valores nulos', () => {
      expect(servicio.capitalizar(null)).toBe('');
      expect(servicio.capitalizar(undefined)).toBe('');
    });
  });
});
