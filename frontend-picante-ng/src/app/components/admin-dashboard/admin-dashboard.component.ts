import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService, RestaurantTable, RestaurantOrder } from '../../services/table.service';
import { ProductService, Product } from '../../services/product';
import { InventoryService, Ingredient, Recipe } from '../../services/inventory.service';
import { DeliveryService, DeliveryOrder, DeliveryOrderItem } from '../../services/delivery.service';
import { UseTablesQuery } from '../../services/use-tables.query';
import { UseDeliveryQuery } from '../../services/use-delivery.query';
import { UseInventoryQuery } from '../../services/use-inventory.query';
import { Subscription } from 'rxjs';
import { TimerComponent } from '../timer/timer.component';
import { MenuModalComponent } from '../menu-modal/menu-modal.component';
import { BotonActualizarComponent } from '../boton-actualizar/boton-actualizar.component';
import { PaymentModalComponent, PaymentData } from '../payment-modal/payment-modal.component';
import { ReceiptModalComponent } from '../receipt-modal/receipt-modal.component';
import { ReceiptComponent } from '../receipt/receipt.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TimerComponent, MenuModalComponent, BotonActualizarComponent, PaymentModalComponent, ReceiptModalComponent, ReceiptComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private tableService = inject(TableService);
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private deliveryService = inject(DeliveryService);
  private useTablesQuery = inject(UseTablesQuery);
  private useDeliveryQuery = inject(UseDeliveryQuery);
  private useInventoryQuery = inject(UseInventoryQuery);
  private cdr = inject(ChangeDetectorRef);
  private subs: Subscription[] = [];

  // ===== MÓDULO 1: GESTIÓN DE MESAS =====
  tables: RestaurantTable[] = [];
  loadingTables = false;
  cargandoMesas = false;
  payFeedback = '';

  // ===== COBRO / COMPROBANTE =====
  showPaymentModal: boolean = false;
  selectedTableForPayment: RestaurantTable | null = null;
  currentOrderForPayment: RestaurantOrder | null = null;
  mozoTime: number = 0;
  kitchenTime: number = 0;
  lastPaymentData: PaymentData | null = null;
  showReceipt: boolean = false;

  // ===== MÓDULO 2: INVENTARIO AVANZADO =====
  ingredients: Ingredient[] = [];
  recipes: Recipe[] = [];
  inventoryFeedback = '';
  editingIngredient: Ingredient | null = null;

  // ===== MÓDULO 3: DELIVERIES =====
  deliveryOrders: DeliveryOrder[] = [];
  activeDeliveries: DeliveryOrder[] = [];
  completedDeliveries: DeliveryOrder[] = [];
  deliveriesTab = signal<'activos' | 'guardados'>('activos');
  products: Product[] = [];
  selectedCategory = 'Entrada';
  productsByCategory: { [key: string]: Product[] } = {};
  deliverySearchText: string = ''; // Búsqueda en modal de delivery

  // MODAL STATE
  deliveryModalOpen = false;
  deliveryFormData: DeliveryOrder = {
    customerName: '',
    phone: '',
    address: '',
    reference: '',
    notes: '',
    items: [],
    status: 'pending',
    totalAmount: 0
  };
  deliveryCartItems: DeliveryOrderItem[] = [];
  deliveryFeedback = '';

  // ===== MÓDULO 4: MODAL DE MENÚ COMPARTIDO =====
  menuModalOpen = false;
  menuPreviewMode = false; // Para vista previa readonly

  // TAB NAVIGATION
  activeTab = signal<'mesas' | 'inventario' | 'deliveries' | 'carta' | 'ventas'>('mesas');

  // ===== MÓDULO 5: VENTAS =====
  completedOrders: RestaurantOrder[] = [];
  filteredOrders: RestaurantOrder[] = [];
  salesFilterType = signal<'dia' | 'semana' | 'mes'>('dia');
  loadingSales = false;
  totalSales: number = 0;

  // Exponer Date para el template
  Date = Date;

  ngOnInit(): void {
    // Carga inicial sin polling automático
    this.subs.push(
      this.useTablesQuery.useAllTables({
        refetchInterval: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false
      }).subscribe(state => {
        if (state.data) {
          this.tables = state.data;
          this.loadingTables = state.isLoading && !state.isStale;
        }
      })
    );

    // Deliveries sin polling automático
    this.subs.push(
      this.useDeliveryQuery.useAllDeliveries({
        refetchInterval: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false
      }).subscribe(state => {
        if (state.data) {
          this.deliveryOrders = state.data;
          this.separateDeliveries();
        }
      })
    );

    // Toast de stock bajo
    this.subs.push(
      this.useInventoryQuery.useLowStockIngredients().subscribe(state => {
        if (state.ingredients && state.ingredients.length > 0) {
          const lowStock = state.ingredients[0];
          this.inventoryFeedback = `⚠ Stock bajo: ${lowStock.name}`;
          setTimeout(() => (this.inventoryFeedback = ''), 3000);
        }
      })
    );

    // Cargar inventario y recetas (sin polling, una sola carga)
    this.loadInventory();
    this.loadRecipes();
    this.loadProducts();
  }

  setTab(tab: 'mesas' | 'inventario' | 'deliveries' | 'carta' | 'ventas') {
    this.activeTab.set(tab);
    // Cargar ventas cuando se accede a esa pestaña
    if (tab === 'ventas') {
      this.loadSales();
    }
  }

  // ===== MÓDULO 1: MESAS =====
  /**
   * Actualiza la lista de mesas con indicador de carga
   */
  actualizarMesas(): void {
    this.cargandoMesas = true;
    this.useTablesQuery.invalidateTables();
    // Simular delay mínimo para feedback visual
    setTimeout(() => {
      this.cargandoMesas = false;
    }, 500);
  }

  /**
   * @deprecated Usar actualizarMesas() en su lugar
   */
  loadTables() {
    this.actualizarMesas();
  }

  // ===== COBRO / COMPROBANTE =====
  confirmarCobro(table: RestaurantTable): void {
    if (!table) return;
    this.selectedTableForPayment = table;
    this.tableService.getOrderDetails(table.id).subscribe(order => {
      console.log('✅ Orden recibida del backend:', order);
      this.currentOrderForPayment = order;
      this.debugOrderDetails(order);
      this.calculateTimings(order);
      this.showPaymentModal = true;
    }, error => {
      console.error('❌ Error al obtener detalles de la orden:', error);
    });
  }

  private debugOrderDetails(order: RestaurantOrder): void {
    console.log('=== Detalles de Orden ===');
    console.log('Order ID:', order.id);
    console.log('Table ID:', order.tableId);
    console.log('Table Name:', order.tableName);
    console.log('Status:', order.status);
    console.log('Total Amount:', order.totalAmount);
    console.log('Items count:', order.items?.length || 0);
    console.log('Items:', order.items);
    console.log('Created At:', order.createdAt);
    console.log('==========================');
  }

  private calculateTimings(order: RestaurantOrder): void {
    if (!order || !order.createdAt) return;
    const createdTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const totalSeconds = Math.floor((now - createdTime) / 1000);
    
    // Distribuir tiempo: primer 60% al mozo, último 40% a cocina
    this.mozoTime = Math.floor(totalSeconds * 0.6);
    this.kitchenTime = totalSeconds - this.mozoTime;
  }

  onPaymentConfirm(paymentData: PaymentData): void {
    if (!this.selectedTableForPayment) return;
    this.lastPaymentData = paymentData;
    
    // Optimistic UI
    const tableId = this.selectedTableForPayment.id;
    this.tables = this.tables.map(t => t.id === tableId ? ({ ...t, status: 'AVAILABLE' } as RestaurantTable) : t);
    
    this.tableService.payTable(this.selectedTableForPayment.id).subscribe({
      next: () => {
        this.showPaymentModal = false;
        this.showReceipt = true;
        this.useTablesQuery.invalidateTables();
      },
      error: (err) => {
        this.payFeedback = '✗ Error: ' + (err?.error?.message || 'No se pudo procesar el pago');
        this.useTablesQuery.invalidateTables();
      }
    });
  }

  onPaymentClose(): void {
    this.showPaymentModal = false;
    this.selectedTableForPayment = null;
    this.currentOrderForPayment = null;
    this.lastPaymentData = null;
  }

  onReceiptClose(): void {
    this.showReceipt = false;
    this.lastPaymentData = null;
  }

  printReceipt(): void {
    window.print();
  }

  pay(tableId: number) {
    this.payFeedback = '';
    this.tableService.payTable(tableId).subscribe({
      next: (msg) => {
        this.payFeedback = '✓ Pago procesado exitosamente';
        // Invalidar caché de mesas para que se refetch en background
        this.useTablesQuery.invalidateTables();
        setTimeout(() => this.payFeedback = '', 1500);
      },
      error: (err) => {
        this.payFeedback = '✗ Error: ' + (err?.error?.message || 'No se pudo procesar el pago');
      }
    });
  }

  // ===== MÓDULO 2: INVENTARIO AVANZADO =====
  loadInventory() {
    // Usar useInventoryQuery para cargar ingredientes con caché + SWR
    this.subs.push(
      this.useInventoryQuery.useAllIngredients().subscribe(state => {
        this.ingredients = state.ingredients;
      })
    );
  }

  loadRecipes() {
    this.inventoryService.getRecipes().subscribe(recipes => {
      this.recipes = recipes;
    });
  }

  isLowStock(ingredient: Ingredient): boolean {
    return this.inventoryService.isLowStock(ingredient);
  }

  startEditIngredient(ingredient: Ingredient) {
    this.editingIngredient = { ...ingredient };
  }

  cancelEditIngredient() {
    this.editingIngredient = null;
  }

  saveIngredientChange() {
    if (!this.editingIngredient) return;
    
    // Usar mutation para actualizar con optimistic update + invalidación
    this.useInventoryQuery.updateIngredientStockMutation(
      this.editingIngredient.id, 
      this.editingIngredient.stock
    ).subscribe({
      next: () => {
        this.inventoryFeedback = `✓ Stock de ${this.editingIngredient!.name} actualizado`;
        this.editingIngredient = null;
        setTimeout(() => this.inventoryFeedback = '', 2000);
      },
      error: () => {
        this.inventoryFeedback = '✗ Error al actualizar el stock';
      }
    });
  }

  consumeRecipeIngredients(recipe: Recipe) {
    const success = this.inventoryService.consumeIngredientByRecipe(recipe.id);
    if (success) {
      this.inventoryFeedback = `✓ Insumos de "${recipe.dishName}" descontados automáticamente`;
    } else {
      this.inventoryFeedback = `✗ Stock insuficiente para "${recipe.dishName}"`;
    }
    setTimeout(() => this.inventoryFeedback = '', 3000);
  }

  // ===== MÓDULO 3: DELIVERIES =====
  loadProducts() {
    this.productService.getAllProducts().subscribe({
      next: (prods) => {
        this.products = prods;
        this.groupProductsByCategory(prods);
      }
    });
  }

  loadDeliveryOrders() {
    // Las deliveries ya se cargan automáticamente en ngOnInit con SWR
    // Pero este método puede usarse para forzar una refetch inmediata
    this.useDeliveryQuery.invalidateDeliveries();
  }

  private separateDeliveries() {
    const activeStatuses = ['pending', 'preparing', 'ready'];
    this.activeDeliveries = this.deliveryOrders.filter(d => 
      activeStatuses.includes(d.status.toLowerCase())
    );
    this.completedDeliveries = this.deliveryOrders.filter(d =>
      !activeStatuses.includes(d.status.toLowerCase())
    );
  }

  setDeliveriesTab(tab: 'activos' | 'guardados') {
    this.deliveriesTab.set(tab);
  }

  private groupProductsByCategory(prods: Product[]): void {
    this.productsByCategory = {};
    prods.forEach(p => {
      const catName = p.category?.name || 'Otros';
      if (!this.productsByCategory[catName]) {
        this.productsByCategory[catName] = [];
      }
      this.productsByCategory[catName].push(p);
    });
    if (Object.keys(this.productsByCategory).length > 0) {
      this.selectedCategory = Object.keys(this.productsByCategory)[0];
    }
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
  }

  addDeliveryItem(product: Product) {
    if (!product.id) return;
    const existingItem = this.deliveryCartItems.find(i => i.productId === product.id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.deliveryCartItems.push({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price
      });
    }
  }

  removeDeliveryItem(productId: number) {
    const item = this.deliveryCartItems.find(i => i.productId === productId);
    if (item) {
      item.quantity--;
      if (item.quantity === 0) {
        this.deliveryCartItems = this.deliveryCartItems.filter(i => i.productId !== productId);
      }
    }
  }

  getDeliveryItemQty(productId: number): number {
    return this.deliveryCartItems.find(i => i.productId === productId)?.quantity || 0;
  }

  getTotalDeliveryItems(): number {
    return this.deliveryCartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalDeliveryPrice(): number {
    return this.deliveryCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  openDeliveryModal() {
    this.deliveryModalOpen = true;
    this.deliveryCartItems = [];
    this.deliverySearchText = ''; // Limpiar búsqueda
    this.deliveryFormData = {
      customerName: '',
      phone: '',
      address: '',
      reference: '',
      notes: '',
      items: [],
      status: 'pending',
      totalAmount: 0
    };
    if (Object.keys(this.productsByCategory).length === 0) {
      this.loadProducts();
    }
  }

  closeDeliveryModal() {
    this.deliveryModalOpen = false;
    this.deliveryCartItems = [];
    this.deliverySearchText = ''; // Limpiar búsqueda
    this.deliveryFormData = {
      customerName: '',
      phone: '',
      address: '',
      reference: '',
      notes: '',
      items: [],
      status: 'pending',
      totalAmount: 0
    };
  }

  openWhatsApp() {
    this.deliveryService.openWhatsApp('+51987935344', 'Restaurante Picante');
  }

  submitDeliveryOrder() {
    if (!this.deliveryFormData.customerName.trim()) {
      this.deliveryFeedback = '✗ Ingresa el nombre del cliente';
      return;
    }
    if (!this.deliveryFormData.phone.trim()) {
      this.deliveryFeedback = '✗ Ingresa el número de teléfono';
      return;
    }
    if (!this.deliveryFormData.address.trim()) {
      this.deliveryFeedback = '✗ Ingresa la dirección de entrega';
      return;
    }
    if (this.deliveryCartItems.length === 0) {
      this.deliveryFeedback = '✗ Agrega productos al pedido';
      return;
    }

    this.deliveryFormData.items = this.deliveryCartItems as any;
    this.deliveryFormData.totalAmount = this.getTotalDeliveryPrice();

    this.deliveryService.createDeliveryOrder(this.deliveryFormData).subscribe({
      next: (createdOrder) => {
        console.log('Delivery creado:', createdOrder);
        this.deliveryFeedback = `✓ Pedido #${createdOrder.id} creado, enviando a cocina...`;

        // Enviar a cocina como lo hace el mozo
        if (createdOrder.id) {
          const kitchenItems = this.deliveryCartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }));

          this.deliveryService.sendDeliveryToKitchen(createdOrder.id, kitchenItems).subscribe({
            next: (response) => {
              console.log('Delivery enviado a cocina:', response);
              this.deliveryFeedback = `✓ Pedido #${createdOrder.id} enviado a cocina`;
              // Invalidar caché de deliveries para que se refetch
              this.useDeliveryQuery.invalidateDeliveries();
              setTimeout(() => {
                this.closeDeliveryModal();
                this.deliveryFeedback = '';
              }, 1500);
            },
            error: (error) => {
              console.error('Error enviando a cocina:', error);
              // Aún así se creó el pedido, solo hubo error al enviar
              this.deliveryFeedback = `⚠ Pedido creado (#${createdOrder.id}) pero hay error enviándolo a cocina`;
              this.useDeliveryQuery.invalidateDeliveries();
              setTimeout(() => {
                this.closeDeliveryModal();
                this.deliveryFeedback = '';
              }, 2000);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error creando delivery:', error);
        this.deliveryFeedback = '✗ Error al crear el pedido de delivery';
      }
    });
  }

  printDeliveryTicket(order: DeliveryOrder) {
    if (!order || !order.items || order.items.length === 0) {
      console.warn('⚠️ No se puede imprimir: orden sin items', order);
      alert('Esta orden no tiene items para imprimir.');
      return;
    }
    
    const ticketHTML = this.deliveryService.generateDeliveryTicket(order);
    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(ticketHTML);
      printWindow.document.close();
      // Auto-imprimir después de cargar
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
        }, 250);
      };
    }
  }

  updateDeliveryStatus(order: DeliveryOrder, nextStatus: 'preparing' | 'ready' | 'dispatched' | 'delivered') {
    if (!order.id) return;
    
    // Usar la mutación que implementa actualización optimista + invalidación
    this.useDeliveryQuery.updateDeliveryStatusMutation(order.id, nextStatus).subscribe({
      next: () => {
        const statusText = nextStatus === 'preparing' ? 'Preparando' 
                         : nextStatus === 'ready' ? 'Listo'
                         : nextStatus === 'dispatched' ? 'Despachado'
                         : 'Entregado';
        this.deliveryFeedback = `✓ Pedido #${order.id} ahora está: ${statusText}`;
        setTimeout(() => {
          this.deliveryFeedback = '';
        }, 1000);
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        this.deliveryFeedback = '✗ Error al actualizar el estado';
      }
    });
  }

  getNextDeliveryStatus(currentStatus: string): { label: string, value: 'preparing' | 'ready' | 'dispatched' | 'delivered' } | null {
    const transitions: { [key: string]: { label: string, value: 'preparing' | 'ready' | 'dispatched' | 'delivered' } } = {
      'PENDING': { label: 'Preparando', value: 'preparing' },
      'PREPARING': { label: 'Listo', value: 'ready' },
      'READY': { label: 'Despachado', value: 'dispatched' },
      'DISPATCHED': { label: 'Entregado', value: 'delivered' }
    };
    return transitions[currentStatus?.toUpperCase()] || null;
  }

  // Búsqueda de productos en modal de delivery - busca en TODAS las categorías
  getFilteredDeliveryProducts(): Product[] {
    if (!this.deliverySearchText.trim()) {
      return [];
    }
    const search = this.deliverySearchText.trim().toLowerCase();
    return this.products.filter(prod => 
      prod.name.toLowerCase().includes(search) ||
      (prod.description && prod.description.toLowerCase().includes(search))
    );
  }

  // Obtener categorías únicas con IDs
  getCategoriesWithIds(): Array<{ id: number; name: string }> {
    const cats = new Map<number, string>();
    this.products.forEach(prod => {
      if (prod.category?.id && prod.category?.name) {
        cats.set(prod.category.id, prod.category.name);
      }
    });
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name }));
  }

  // Contar productos por categoría
  getProductsCountByCategory(categoryId: number): number {
    return this.products.filter(p => p.category?.id === categoryId).length;
  }

  getCategories(): string[] {
    return Object.keys(this.productsByCategory);
  }

  getCategoryProducts(category: string): Product[] {
    return this.productsByCategory[category] || [];
  }
  getIngredientName(ingredientId: number): string {
    return this.ingredients.find(i => i.id === ingredientId)?.name || 'Insumo';
  }



  getTotalOrderPrice(): number {
    return 0; // TODO: Implementar cálculo de órdenes por mesa
  }

  editDeliveryOrder(order: DeliveryOrder) {
    console.log('Edit delivery order:', order);
    // TODO: Implementar edición de delivery
  }

  removeDeliveryOrder(id: number) {
    console.log('Remove delivery order:', id);
    // TODO: Implementar eliminación de delivery
  }

  // ===== MÓDULO 5: VENTAS =====
  loadSales(): void {
    this.loadingSales = true;
    // Obtener todos los pedidos completados (PAID)
    this.tableService.getCompletedOrders().subscribe({
      next: (orders) => {
        this.completedOrders = orders || [];
        this.applyDateFilter();
        this.loadingSales = false;
      },
      error: (err) => {
        console.error('Error cargando ventas:', err);
        // Si el endpoint no existe, usar getAllTables como alternativa
        this.tableService.getAllTables().subscribe({
          next: (tables) => {
            this.completedOrders = [];
            // Intentar obtener órdenes de cada tabla
            tables.forEach(table => {
              if (table.currentOrder && table.currentOrder.status === 'PAID') {
                this.completedOrders.push(table.currentOrder);
              }
            });
            this.applyDateFilter();
            this.loadingSales = false;
          },
          error: (err2) => {
            console.error('Error cargando ventas (alternativa):', err2);
            this.completedOrders = [];
            this.applyDateFilter();
            this.loadingSales = false;
          }
        });
      }
    });
  }

  applyDateFilter(): void {
    const now = new Date();
    const filterType = this.salesFilterType();
    
    let startDate: Date;
    let endDate: Date = now;

    switch (filterType) {
      case 'dia':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        // Inicio de la semana (lunes)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      case 'mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    this.filteredOrders = this.completedOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    this.calculateTotalSales();
  }

  changeDateFilter(filterType: 'dia' | 'semana' | 'mes'): void {
    this.salesFilterType.set(filterType);
    this.applyDateFilter();
  }

  calculateTotalSales(): void {
    this.totalSales = this.filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones activas
    this.subs.forEach(sub => sub.unsubscribe());
  }
}
