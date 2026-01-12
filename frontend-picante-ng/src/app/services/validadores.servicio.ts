/**
 * Servicio de Validaciones Compartido
 * Centraliza toda la lógica de validación para evitar duplicación (DRY)
 * 
 * @autor Equipo El Picante
 * @version 1.0.0
 */
import { Injectable } from '@angular/core';

export interface ResultadoValidacion {
  esValido: boolean;
  mensaje: string;
}

export interface DatosComprobante {
  tipo: 'BOLETA' | 'FACTURA';
  numero: string;
  documentoId: string;
  nombre: string;
}

export interface DatosPago {
  metodoPago: 'EFECTIVO' | 'YAPE' | 'TARJETA' | 'OTRO';
  montoRecibido: number | null;
  montoTotal: number;
  comprobante: DatosComprobante;
}

@Injectable({
  providedIn: 'root'
})
export class ValidadoresServicio {

  /**
   * Valida si una cadena contiene solo números
   */
  esNumerico(valor: string): boolean {
    return /^\d+$/.test(valor);
  }

  /**
   * Valida un DNI peruano (8 dígitos)
   */
  validarDNI(dni: string): ResultadoValidacion {
    if (!dni || dni.trim() === '') {
      return { esValido: true, mensaje: '' }; // DNI es opcional
    }
    
    if (!this.esNumerico(dni)) {
      return { esValido: false, mensaje: 'El DNI debe contener solo números.' };
    }
    
    if (dni.length !== 8) {
      return { esValido: false, mensaje: 'El DNI debe tener exactamente 8 dígitos.' };
    }
    
    return { esValido: true, mensaje: '' };
  }

  /**
   * Valida un RUC peruano (11 dígitos)
   */
  validarRUC(ruc: string): ResultadoValidacion {
    if (!ruc || ruc.trim() === '') {
      return { esValido: false, mensaje: 'El RUC es requerido para facturas.' };
    }
    
    if (!this.esNumerico(ruc)) {
      return { esValido: false, mensaje: 'El RUC debe contener solo números.' };
    }
    
    if (ruc.length !== 11) {
      return { esValido: false, mensaje: 'El RUC debe tener exactamente 11 dígitos.' };
    }
    
    // Validación de prefijo válido de RUC peruano
    const prefijosValidos = ['10', '15', '17', '20'];
    const prefijo = ruc.substring(0, 2);
    if (!prefijosValidos.includes(prefijo)) {
      return { esValido: false, mensaje: 'El RUC tiene un prefijo inválido.' };
    }
    
    return { esValido: true, mensaje: '' };
  }

  /**
   * Valida los datos completos del formulario de pago
   */
  validarFormularioPago(datos: DatosPago): ResultadoValidacion {
    // Validar monto en efectivo
    if (datos.metodoPago === 'EFECTIVO') {
      if (datos.montoRecibido === null || datos.montoRecibido === undefined) {
        return { esValido: false, mensaje: 'Debe ingresar el monto recibido.' };
      }
      if (datos.montoRecibido < datos.montoTotal) {
        return { esValido: false, mensaje: 'El monto recibido es menor que el total a pagar.' };
      }
    }
    
    // Validar según tipo de comprobante
    if (datos.comprobante.tipo === 'FACTURA') {
      const validacionRUC = this.validarRUC(datos.comprobante.documentoId);
      if (!validacionRUC.esValido) {
        return validacionRUC;
      }
      
      if (!datos.comprobante.nombre || datos.comprobante.nombre.trim().length < 2) {
        return { esValido: false, mensaje: 'La Razón Social es requerida para facturas.' };
      }
    } else {
      // Boleta - DNI es opcional pero si se ingresa debe ser válido
      if (datos.comprobante.documentoId) {
        const validacionDNI = this.validarDNI(datos.comprobante.documentoId);
        if (!validacionDNI.esValido) {
          return validacionDNI;
        }
      }
    }
    
    return { esValido: true, mensaje: '' };
  }

  /**
   * Valida que un pedido tenga al menos un producto
   */
  validarPedidoNoVacio(cantidades: { [productoId: number]: number }): ResultadoValidacion {
    const total = Object.values(cantidades).reduce((sum, qty) => sum + qty, 0);
    
    if (total === 0) {
      return { esValido: false, mensaje: 'Debe seleccionar al menos un producto.' };
    }
    
    return { esValido: true, mensaje: '' };
  }

  /**
   * Valida el formato de un número de teléfono peruano
   */
  validarTelefono(telefono: string): ResultadoValidacion {
    if (!telefono || telefono.trim() === '') {
      return { esValido: false, mensaje: 'El teléfono es requerido.' };
    }
    
    // Eliminar espacios y guiones
    const telefonoLimpio = telefono.replace(/[\s-]/g, '');
    
    // Validar formato (9 dígitos comenzando con 9 para celulares)
    if (!/^9\d{8}$/.test(telefonoLimpio)) {
      return { esValido: false, mensaje: 'El teléfono debe ser un número de celular válido (9 dígitos comenzando con 9).' };
    }
    
    return { esValido: true, mensaje: '' };
  }

  /**
   * Valida una dirección de delivery
   */
  validarDireccion(direccion: string): ResultadoValidacion {
    if (!direccion || direccion.trim() === '') {
      return { esValido: false, mensaje: 'La dirección es requerida.' };
    }
    
    if (direccion.trim().length < 10) {
      return { esValido: false, mensaje: 'La dirección debe ser más específica (mínimo 10 caracteres).' };
    }
    
    return { esValido: true, mensaje: '' };
  }

  /**
   * Genera un número de documento automático
   */
  generarNumeroDocumento(tipo: 'BOLETA' | 'FACTURA'): string {
    const prefijo = tipo === 'BOLETA' ? 'B001' : 'F001';
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const dia = ahora.getDate().toString().padStart(2, '0');
    const hora = ahora.getHours().toString().padStart(2, '0');
    const minuto = ahora.getMinutes().toString().padStart(2, '0');
    const segundo = ahora.getSeconds().toString().padStart(2, '0');
    
    return `${prefijo}-${año}${mes}${dia}-${hora}${minuto}${segundo}`;
  }

  /**
   * Calcula el vuelto para pagos en efectivo
   */
  calcularVuelto(montoRecibido: number | null, montoTotal: number): number {
    if (montoRecibido === null || montoRecibido === undefined) {
      return 0;
    }
    const vuelto = montoRecibido - montoTotal;
    return vuelto > 0 ? vuelto : 0;
  }
}
