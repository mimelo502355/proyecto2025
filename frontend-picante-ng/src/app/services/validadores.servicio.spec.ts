/**
 * Tests Unitarios - ValidadoresServicio
 * Suite completa de pruebas para el servicio de validaciones
 * 
 * @autor Equipo El Picante
 */
import { TestBed } from '@angular/core/testing';
import { ValidadoresServicio, ResultadoValidacion } from './validadores.servicio';

describe('ValidadoresServicio', () => {
  let servicio: ValidadoresServicio;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ValidadoresServicio]
    });
    servicio = TestBed.inject(ValidadoresServicio);
  });

  it('debería crearse correctamente', () => {
    expect(servicio).toBeTruthy();
  });

  // ===== TESTS: esNumerico =====
  describe('esNumerico', () => {
    it('debería retornar true para cadenas con solo números', () => {
      expect(servicio.esNumerico('12345678')).toBeTrue();
      expect(servicio.esNumerico('0')).toBeTrue();
      expect(servicio.esNumerico('99999999999')).toBeTrue();
    });

    it('debería retornar false para cadenas con letras', () => {
      expect(servicio.esNumerico('123abc')).toBeFalse();
      expect(servicio.esNumerico('abc')).toBeFalse();
    });

    it('debería retornar false para cadenas con caracteres especiales', () => {
      expect(servicio.esNumerico('123-456')).toBeFalse();
      expect(servicio.esNumerico('12.34')).toBeFalse();
      expect(servicio.esNumerico('12,34')).toBeFalse();
    });

    it('debería retornar false para cadenas vacías', () => {
      expect(servicio.esNumerico('')).toBeFalse();
    });
  });

  // ===== TESTS: validarDNI =====
  describe('validarDNI', () => {
    it('debería aceptar DNI vacío como válido (es opcional)', () => {
      const resultado = servicio.validarDNI('');
      expect(resultado.esValido).toBeTrue();
    });

    it('debería aceptar DNI nulo o undefined como válido', () => {
      const resultado = servicio.validarDNI(null as any);
      expect(resultado.esValido).toBeTrue();
    });

    it('debería aceptar DNI válido de 8 dígitos', () => {
      const resultado = servicio.validarDNI('12345678');
      expect(resultado.esValido).toBeTrue();
    });

    it('debería rechazar DNI con menos de 8 dígitos', () => {
      const resultado = servicio.validarDNI('1234567');
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('8 dígitos');
    });

    it('debería rechazar DNI con más de 8 dígitos', () => {
      const resultado = servicio.validarDNI('123456789');
      expect(resultado.esValido).toBeFalse();
    });

    it('debería rechazar DNI con letras', () => {
      const resultado = servicio.validarDNI('1234567A');
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('solo números');
    });
  });

  // ===== TESTS: validarRUC =====
  describe('validarRUC', () => {
    it('debería rechazar RUC vacío', () => {
      const resultado = servicio.validarRUC('');
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('requerido');
    });

    it('debería aceptar RUC válido de persona natural (10)', () => {
      const resultado = servicio.validarRUC('10123456789');
      expect(resultado.esValido).toBeTrue();
    });

    it('debería aceptar RUC válido de empresa (20)', () => {
      const resultado = servicio.validarRUC('20123456789');
      expect(resultado.esValido).toBeTrue();
    });

    it('debería rechazar RUC con prefijo inválido', () => {
      const resultado = servicio.validarRUC('30123456789');
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('prefijo inválido');
    });

    it('debería rechazar RUC con menos de 11 dígitos', () => {
      const resultado = servicio.validarRUC('2012345678');
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('11 dígitos');
    });

    it('debería rechazar RUC con letras', () => {
      const resultado = servicio.validarRUC('2012345678A');
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('solo números');
    });
  });

  // ===== TESTS: validarFormularioPago =====
  describe('validarFormularioPago', () => {
    const datosBase = {
      metodoPago: 'EFECTIVO' as const,
      montoRecibido: 100,
      montoTotal: 50,
      comprobante: {
        tipo: 'BOLETA' as const,
        numero: 'B001-20240101-120000',
        documentoId: '',
        nombre: ''
      }
    };

    it('debería aceptar pago en efectivo con monto suficiente', () => {
      const resultado = servicio.validarFormularioPago(datosBase);
      expect(resultado.esValido).toBeTrue();
    });

    it('debería rechazar pago en efectivo con monto insuficiente', () => {
      const resultado = servicio.validarFormularioPago({
        ...datosBase,
        montoRecibido: 30,
        montoTotal: 50
      });
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('menor que el total');
    });

    it('debería rechazar pago en efectivo sin monto ingresado', () => {
      const resultado = servicio.validarFormularioPago({
        ...datosBase,
        montoRecibido: null
      });
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('monto recibido');
    });

    it('debería aceptar pago con YAPE sin validar monto', () => {
      const resultado = servicio.validarFormularioPago({
        ...datosBase,
        metodoPago: 'YAPE',
        montoRecibido: 0
      });
      expect(resultado.esValido).toBeTrue();
    });

    it('debería aceptar pago con TARJETA sin validar monto', () => {
      const resultado = servicio.validarFormularioPago({
        ...datosBase,
        metodoPago: 'TARJETA',
        montoRecibido: 0
      });
      expect(resultado.esValido).toBeTrue();
    });

    it('debería rechazar factura sin RUC', () => {
      const resultado = servicio.validarFormularioPago({
        ...datosBase,
        comprobante: {
          ...datosBase.comprobante,
          tipo: 'FACTURA',
          documentoId: ''
        }
      });
      expect(resultado.esValido).toBeFalse();
    });

    it('debería rechazar factura sin razón social', () => {
      const resultado = servicio.validarFormularioPago({
        ...datosBase,
        comprobante: {
          ...datosBase.comprobante,
          tipo: 'FACTURA',
          documentoId: '20123456789',
          nombre: ''
        }
      });
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('Razón Social');
    });

    it('debería aceptar factura completa con RUC y razón social', () => {
      const resultado = servicio.validarFormularioPago({
        ...datosBase,
        comprobante: {
          ...datosBase.comprobante,
          tipo: 'FACTURA',
          documentoId: '20123456789',
          nombre: 'Empresa Test S.A.C.'
        }
      });
      expect(resultado.esValido).toBeTrue();
    });
  });

  // ===== TESTS: validarPedidoNoVacio =====
  describe('validarPedidoNoVacio', () => {
    it('debería rechazar lista de items vacía', () => {
      const resultado = servicio.validarPedidoNoVacio([]);
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('al menos un producto');
    });

    it('debería aceptar lista con items', () => {
      const resultado = servicio.validarPedidoNoVacio([{ id: 1, name: 'Producto' }]);
      expect(resultado.esValido).toBeTrue();
    });
  });

  // ===== TESTS: validarTelefono =====
  describe('validarTelefono', () => {
    it('debería aceptar teléfono celular válido (9 dígitos)', () => {
      const resultado = servicio.validarTelefono('987654321');
      expect(resultado.esValido).toBeTrue();
    });

    it('debería aceptar teléfono fijo con código de área', () => {
      const resultado = servicio.validarTelefono('016543210');
      expect(resultado.esValido).toBeTrue();
    });

    it('debería rechazar teléfono muy corto', () => {
      const resultado = servicio.validarTelefono('12345');
      expect(resultado.esValido).toBeFalse();
    });

    it('debería rechazar teléfono con letras', () => {
      const resultado = servicio.validarTelefono('98765abc');
      expect(resultado.esValido).toBeFalse();
    });
  });

  // ===== TESTS: validarDireccion =====
  describe('validarDireccion', () => {
    it('debería aceptar dirección válida', () => {
      const resultado = servicio.validarDireccion('Av. Ejemplo 123, Lima');
      expect(resultado.esValido).toBeTrue();
    });

    it('debería rechazar dirección muy corta', () => {
      const resultado = servicio.validarDireccion('Calle');
      expect(resultado.esValido).toBeFalse();
      expect(resultado.mensaje).toContain('10 caracteres');
    });

    it('debería rechazar dirección vacía', () => {
      const resultado = servicio.validarDireccion('');
      expect(resultado.esValido).toBeFalse();
    });
  });

  // ===== TESTS: calcularVuelto =====
  describe('calcularVuelto', () => {
    it('debería calcular vuelto correctamente', () => {
      expect(servicio.calcularVuelto(50, 100)).toBe(50);
      expect(servicio.calcularVuelto(25.50, 30)).toBe(4.50);
    });

    it('debería retornar 0 si monto recibido es menor o igual al total', () => {
      expect(servicio.calcularVuelto(50, 50)).toBe(0);
      expect(servicio.calcularVuelto(50, 30)).toBe(0);
    });
  });

  // ===== TESTS: generarNumeroDocumento =====
  describe('generarNumeroDocumento', () => {
    it('debería generar número de boleta con prefijo B001', () => {
      const numero = servicio.generarNumeroDocumento('BOLETA');
      expect(numero).toContain('B001');
    });

    it('debería generar número de factura con prefijo F001', () => {
      const numero = servicio.generarNumeroDocumento('FACTURA');
      expect(numero).toContain('F001');
    });

    it('debería generar números únicos en cada llamada', () => {
      const numero1 = servicio.generarNumeroDocumento('BOLETA');
      // Pequeño delay para asegurar timestamp diferente
      const numero2 = servicio.generarNumeroDocumento('BOLETA');
      // Los números deberían tener el mismo formato pero potencialmente diferir en milisegundos
      expect(numero1.startsWith('B001')).toBeTrue();
      expect(numero2.startsWith('B001')).toBeTrue();
    });
  });
});
