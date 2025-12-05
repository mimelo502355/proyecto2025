import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Estructura simplificada del Pedido para la Cocina
interface KitchenOrderItem {
  name: string;
  quantity: number;
  notes: string;
}

interface KitchenOrder {
  id: string;
  mesaId: number;
  estado: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO';
  tiempoRecepcion: Date;
  items: KitchenOrderItem[];
}

@Component({
  selector: 'app-cocina-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cocina-dashboard.html',
  styleUrls: ['./cocina-dashboard.css']
})
export class CocinaDashboardComponent implements OnInit {
  
  // Lista de pedidos que llegan a la cocina
  allOrders = signal<KitchenOrder[]>([]);

  // Pedidos separados por estado (Computed Signals)
  pendingOrders = signal<KitchenOrder[]>([]);
  inPreparationOrders = signal<KitchenOrder[]>([]);

  ngOnInit(): void {
    // 1. Aquí se iniciaría la suscripción a Firestore
    // para recibir nuevos pedidos en tiempo real (RF-13).
    // Ejemplo: this.firestoreService.listenToOrders().subscribe(orders => this.setOrders(orders));
    
    // Simulación: Cargamos unos pedidos iniciales
    this.loadMockOrders();
  }

  loadMockOrders(): void {
    const mockOrders: KitchenOrder[] = [
      { 
        id: 'P001', mesaId: 2, estado: 'PENDIENTE', tiempoRecepcion: new Date(Date.now() - 5 * 60000), 
        items: [
          { name: 'Ceviche Clásico', quantity: 2, notes: 'Menos ají' },
          { name: 'Gaseosa Cola', quantity: 3, notes: '' },
        ]
      },
      { 
        id: 'P002', mesaId: 5, estado: 'PENDIENTE', tiempoRecepcion: new Date(Date.now() - 10 * 60000), 
        items: [
          { name: 'Lomo Saltado', quantity: 1, notes: 'Carne bien cocida' },
        ]
      },
      { 
        id: 'P003', mesaId: 4, estado: 'EN_PREPARACION', tiempoRecepcion: new Date(Date.now() - 2 * 60000), 
        items: [
          { name: 'Pisco Sour', quantity: 4, notes: 'Doble porción de limón' },
          { name: 'Causa Limeña', quantity: 1, notes: '' },
        ]
      }
    ];
    this.setOrders(mockOrders);
  }

  // Actualiza los arrays de pedidos cuando cambia la fuente de datos
  setOrders(orders: KitchenOrder[]): void {
    this.allOrders.set(orders.sort((a, b) => a.tiempoRecepcion.getTime() - b.tiempoRecepcion.getTime())); // Ordenar por tiempo (más antiguo primero)
    this.pendingOrders.set(this.allOrders().filter(o => o.estado === 'PENDIENTE'));
    this.inPreparationOrders.set(this.allOrders().filter(o => o.estado === 'EN_PREPARACION'));
  }

  // RF-13: Cambiar el estado del pedido (Iniciar preparación o marcar como listo)
  changeOrderStatus(orderId: string, newStatus: 'EN_PREPARACION' | 'LISTO'): void {
    this.allOrders.update(orders => orders.map(order => {
      if (order.id === orderId) {
        console.log(`Pedido ${orderId} cambiado a ${newStatus}`);
        // Aquí se enviaría la actualización de estado a Firestore
        return { ...order, estado: newStatus };
      }
      return order;
    }));
    
    // Re-actualiza las listas filtradas
    this.setOrders(this.allOrders());
  }

  // Utilidad para calcular el tiempo transcurrido
  getTimeElapsed(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s`;
  }

  // Método de utilidad para el CSS (resalta pedidos antiguos)
  getCardClass(order: KitchenOrder): string {
    const minutes = (Date.now() - order.tiempoRecepcion.getTime()) / (1000 * 60);
    if (minutes > 10 && order.estado === 'PENDIENTE') {
      return 'border-red-600 bg-red-100'; // Más de 10 minutos, crítico
    }
    if (minutes > 5 && order.estado === 'PENDIENTE') {
      return 'border-yellow-600 bg-yellow-100'; // Más de 5 minutos, atención
    }
    return 'border-gray-300 bg-white';
  }
}