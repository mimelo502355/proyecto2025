import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidoModalComponent } from '../pedido-modal/pedido-modal';

// Definición de la estructura de una Mesa
interface Mesa {
  id: number;
  capacidad: number;
  estado: 'LIBRE' | 'OCUPADA' | 'PAGANDO';
  pedidoId: string | null; // ID del pedido activo si está OCUPADA/PAGANDO
}

@Component({
  selector: 'app-mozo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PedidoModalComponent],
  templateUrl: './mozo-dashboard.html',
  styleUrls: ['./mozo-dashboard.css'] // Dejamos el CSS vacío por ahora
})
export class MozoDashboardComponent implements OnInit {
  
  // Lista de mesas con Signals para reactividad
  mesas = signal<Mesa[]>([
    { id: 1, capacidad: 4, estado: 'LIBRE', pedidoId: null },
    { id: 2, capacidad: 2, estado: 'OCUPADA', pedidoId: 'PED-001' },
    { id: 3, capacidad: 6, estado: 'LIBRE', pedidoId: null },
    { id: 4, capacidad: 4, estado: 'PAGANDO', pedidoId: 'PED-002' },
    { id: 5, capacidad: 8, estado: 'OCUPADA', pedidoId: 'PED-003' },
    { id: 6, capacidad: 2, estado: 'LIBRE', pedidoId: null },
    { id: 7, capacidad: 4, estado: 'LIBRE', pedidoId: null },
    { id: 8, capacidad: 6, estado: 'OCUPADA', pedidoId: 'PED-004' },
  ]);

  // Estado del Modal de Pedido
  isModalOpen = signal(false);
  selectedMesaId = signal<number | null>(null);

  ngOnInit(): void {
    // Aquí se inicializaría la conexión a Firestore para obtener el estado real de las mesas (RF-07)
    console.log("Dashboard del Mozo iniciado. Conectando a FireStore para el mapa de mesas...");
    // Ejemplo: this.firestoreService.listenToMesas().subscribe(mesas => this.mesas.set(mesas));
  }
  
  // RF-07: Abrir el modal al seleccionar una mesa
  selectMesa(mesa: Mesa): void {
    this.selectedMesaId.set(mesa.id);
    this.isModalOpen.set(true);
    console.log(`Abriendo pedido para la Mesa ${mesa.id}. Estado: ${mesa.estado}`);
  }

  // Cerrar el modal
  closePedidoModal(): void {
    this.isModalOpen.set(false);
    this.selectedMesaId.set(null);
  }

  // Función que se ejecuta cuando se envía un pedido desde el modal (RF-12)
  handleOrderConfirmation(orderItems: any[]): void {
    console.log(`Pedido CONFIRMADO para Mesa ${this.selectedMesaId()}`);
    // Aquí se actualizaría el estado de la mesa a 'OCUPADA' y se guardaría el pedido.
    
    // Simulación: Cambia la mesa a OCUPADA
    this.mesas.update(mesas => 
      mesas.map(m => 
        m.id === this.selectedMesaId() ? 
        { ...m, estado: 'OCUPADA', pedidoId: `PED-${Date.now()}` } : m
      )
    );
    
    // Cierra el modal automáticamente gracias a closePedidoModal() dentro del modal
  }

  // Función para obtener la clase CSS basada en el estado de la mesa
  getMesaClass(estado: Mesa['estado']): string {
    switch (estado) {
      case 'OCUPADA':
        return 'bg-red-500 hover:bg-red-600 border-red-700';
      case 'PAGANDO':
        return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-700';
      case 'LIBRE':
      default:
        return 'bg-green-500 hover:bg-green-600 border-green-700';
    }
  }
}