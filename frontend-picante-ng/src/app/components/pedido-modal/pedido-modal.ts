import { Component, Input, Output, EventEmitter, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Simulamos la estructura de un producto
interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  stock: number;
}

// Estructura del ítem en la comanda
interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  notes: string; // RF-09
}

@Component({
  selector: 'app-pedido-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedido-modal.html',
  styleUrl: './pedido-modal.css',
})
export class PedidoModalComponent implements OnInit {
  // Entrada: ID de la mesa seleccionada desde MozoDashboard
  @Input({ required: true }) mesaId!: number; 
  // Salida: Evento para cerrar el modal o confirmar la acción
  @Output() orderConfirmed = new EventEmitter<OrderItem[]>();
  @Output() closeEvent = new EventEmitter<void>();

  // --- ESTADO LOCAL DEL MODAL ---
  orderItems = signal<OrderItem[]>([]); // La comanda actual (RF-06)
  selectedCategory = signal<number>(1);
  
  // --- DATOS SIMULADOS DEL MENÚ (Se obtendrían de un servicio real) ---
  products: Product[] = [
    { id: 1, name: 'Ceviche Clásico', price: 35.00, categoryId: 1, stock: 10 },
    { id: 2, name: 'Lomo Saltado', price: 42.50, categoryId: 1, stock: 15 },
    { id: 3, name: 'Causa Limeña', price: 28.00, categoryId: 1, stock: 5 },
    { id: 4, name: 'Gaseosa Cola', price: 5.00, categoryId: 2, stock: 50 },
    { id: 5, name: 'Jugo de Naranja', price: 8.00, categoryId: 2, stock: 20 },
    { id: 6, name: 'Pisco Sour', price: 18.00, categoryId: 3, stock: 30 },
  ];

  categories = [
    { id: 1, name: 'Platos Principales' },
    { id: 2, name: 'Bebidas sin Alcohol' },
    { id: 3, name: 'Cócteles' },
  ];

  // --- PROPIEDADES CALCULADAS (Signals) ---
  
  // RF-08: Filtra el menú por la categoría seleccionada
  filteredProducts = computed(() => {
    return this.products.filter(p => p.categoryId === this.selectedCategory());
  });

  // Calcula el total de la comanda
  total = computed(() => {
    return this.orderItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });
  
  ngOnInit(): void {
    // Inicializar con la primera categoría al abrir
    if (this.categories.length > 0) {
      this.selectedCategory.set(this.categories[0].id);
    }
    // Lógica para cargar un pedido existente si la mesa ya estaba ocupada
  }

  // --- MÉTODOS DE INTERACCIÓN ---

  close(): void {
    this.closeEvent.emit();
  }

  selectCategory(categoryId: number): void {
    this.selectedCategory.set(categoryId);
  }

  // RF-08: Añadir producto a la comanda
  addProductToOrder(product: Product): void {
    const existingItemIndex = this.orderItems().findIndex(item => item.productId === product.id);

    if (existingItemIndex !== -1) {
      // Si ya existe, incrementa la cantidad (RF-10)
      this.orderItems.update(items => {
        items[existingItemIndex].quantity += 1;
        return [...items];
      });
    } else {
      // Si es nuevo, añade el ítem (RF-06)
      const newItem: OrderItem = {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        notes: '',
      };
      this.orderItems.update(items => [...items, newItem]);
    }
  }

  // RF-10: Modificar cantidad de un ítem
  changeQuantity(index: number, delta: number): void {
    this.orderItems.update(items => {
      items[index].quantity += delta;
      // Asegurar que la cantidad mínima sea 1 antes de eliminar
      if (items[index].quantity <= 0) {
        this.removeItem(index);
      } else {
        return [...items];
      }
      return items;
    });
  }

  // RF-11: Eliminar producto de la comanda
  removeItem(index: number): void {
     // En un sistema real, se mostraría un modal de confirmación aquí
     // para cumplir con el RF-11 (requiere confirmación).
     if (window.confirm("¿Seguro que deseas eliminar este producto de la comanda?")) {
        this.orderItems.update(items => items.filter((_, i) => i !== index));
     }
  }

  // RF-09: Añadir notas de preparación
  addNote(productId: number): void {
    const itemIndex = this.orderItems().findIndex(item => item.productId === productId);
    if (itemIndex !== -1) {
        const currentNotes = this.orderItems()[itemIndex].notes;
        const note = prompt(`Añadir nota para ${this.orderItems()[itemIndex].name}:`, currentNotes);
        if (note !== null) {
             this.orderItems.update(items => {
                items[itemIndex].notes = note.trim();
                return [...items];
            });
        }
    } else {
        // Si el producto no está en el pedido, lo añadimos primero (lógica mejorada)
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.addProductToOrder(product);
            this.addNote(productId); // Llamamos de nuevo para que ahora sí tenga notas
        }
    }
  }

  // RF-12: Enviar pedido a Cocina
  sendOrderToKitchen(): void {
    if (this.orderItems().length === 0) {
      console.error("El pedido está vacío.");
      return;
    }
    
    // Aquí se enviaría la comanda al servicio (API) para guardar en Firestore
    console.log(`🚀 Enviando Pedido para Mesa ${this.mesaId}:`, this.orderItems());

    // NOTA IMPORTANTE: En la vida real, usaríamos un servicio
    // para grabar el pedido en la colección de Firestore
    // /artifacts/{appId}/public/data/orders/

    this.orderConfirmed.emit(this.orderItems());
    this.close(); // Cerramos el modal
  }
}