/**
 * Servicio de Formateadores
 * Centraliza funciones de formato para fechas, moneda, etc.
 * 
 * @autor Equipo El Picante
 * @version 1.0.0
 */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormateadoresServicio {

  /**
   * Formatea un número como moneda peruana (Soles)
   */
  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return 'S/. 0.00';
    }
    return `S/. ${valor.toFixed(2)}`;
  }

  /**
   * Formatea una fecha en formato peruano
   */
  formatearFecha(fecha: Date | string | null | undefined): string {
    if (!fecha) {
      return '-';
    }
    
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  }

  /**
   * Formatea una fecha con hora
   */
  formatearFechaHora(fecha: Date | string | null | undefined): string {
    if (!fecha) {
      return '-';
    }
    
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const año = fechaObj.getFullYear();
    const hora = fechaObj.getHours().toString().padStart(2, '0');
    const minuto = fechaObj.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${año} ${hora}:${minuto}`;
  }

  /**
   * Calcula tiempo transcurrido desde una fecha
   */
  calcularTiempoTranscurrido(fechaInicio: Date | string | null | undefined): string {
    if (!fechaInicio) {
      return '-';
    }
    
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const ahora = new Date();
    const diferencia = ahora.getTime() - inicio.getTime();
    
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutosRestantes}min`;
    }
    return `${minutos}min`;
  }

  /**
   * Traduce el estado de una mesa al español
   */
  traducirEstadoMesa(estado: string): string {
    const traducciones: { [key: string]: string } = {
      'AVAILABLE': 'Disponible',
      'OCCUPIED': 'Ocupada',
      'READY_TO_KITCHEN': 'Lista para Cocina',
      'WAITING_KITCHEN': 'En Cocina',
      'PREPARING': 'Preparando',
      'READY': 'Lista para Servir',
      'SERVING': 'Sirviendo',
      'WAITING_PAYMENT': 'Esperando Pago'
    };
    
    return traducciones[estado] || estado;
  }

  /**
   * Traduce el estado de un pedido al español
   */
  traducirEstadoPedido(estado: string): string {
    const traducciones: { [key: string]: string } = {
      'OPEN': 'Abierto',
      'WAITING_PAYMENT': 'Por Pagar',
      'PAID': 'Pagado',
      'PENDING': 'Pendiente',
      'PREPARING': 'En Preparación',
      'READY': 'Listo',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado'
    };
    
    return traducciones[estado] || estado;
  }

  /**
   * Obtiene la clase CSS según el estado de la mesa
   */
  obtenerClaseEstadoMesa(estado: string): string {
    const clases: { [key: string]: string } = {
      'AVAILABLE': 'bg-secondary',
      'OCCUPIED': 'bg-warning text-dark',
      'READY_TO_KITCHEN': 'bg-warning text-dark',
      'WAITING_KITCHEN': 'bg-primary',
      'PREPARING': 'bg-primary',
      'READY': 'bg-success',
      'SERVING': 'bg-info',
      'WAITING_PAYMENT': 'bg-danger'
    };
    
    return clases[estado] || 'bg-secondary';
  }

  /**
   * Trunca un texto largo
   */
  truncarTexto(texto: string | null | undefined, longitudMaxima: number = 50): string {
    if (!texto) {
      return '';
    }
    if (texto.length <= longitudMaxima) {
      return texto;
    }
    return texto.substring(0, longitudMaxima) + '...';
  }

  /**
   * Capitaliza la primera letra de cada palabra
   */
  capitalizar(texto: string | null | undefined): string {
    if (!texto) {
      return '';
    }
    return texto.toLowerCase().replace(/\b\w/g, letra => letra.toUpperCase());
  }
}
