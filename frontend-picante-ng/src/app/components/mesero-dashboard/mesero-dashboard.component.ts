import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService, RestaurantTable, RestaurantOrder } from '../../services/table.service';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../services/product';
import { UseTablesQuery } from '../../services/use-tables.query';
import { TimerComponent } from '../timer/timer.component';
import { BotonActualizarComponent } from '../boton-actualizar/boton-actualizar.component';
import { PaymentModalComponent, PaymentData } from '../payment-modal/payment-modal.component';
import { ReceiptComponent } from '../receipt/receipt.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-mesero-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, TimerComponent, BotonActualizarComponent, PaymentModalComponent, ReceiptComponent],
    templateUrl: './mesero-dashboard.component.html',
    styleUrls: ['./mesero-dashboard.component.css']
})
export class MeseroDashboardComponent implements OnInit, OnDestroy {
    // Comentario para forzar recompilación y verificar tipos corregidos
    salonTables: RestaurantTable[] = [];
    patioTables: RestaurantTable[] = [];
    private subs: Subscription[] = [];
    loadingTables: boolean = true;
    // Modal state
    menuModalOpen: boolean = false;
    selectedTable?: RestaurantTable;
    products: Product[] = [];
    groupedProducts: { [key: string]: Product[] } = {};
    selectedCategory: string = '';
    searchText: string = '';
    // Estructura para el pedido temporal: { [productId]: cantidad }
    tempOrder: { [key: number]: number } = {};
    currentUser: any = null;

    // Payment modal mejorado
    showPaymentModal: boolean = false;
    selectedTableForPayment: RestaurantTable | null = null;
    currentOrderForPayment: RestaurantOrder | null = null;
    mozoTime: number = 0;
    kitchenTime: number = 0;
    lastPaymentData: PaymentData | null = null;
    showReceipt: boolean = false;

    // QueryClient hooks
    private useTablesQuery = inject(UseTablesQuery);

    // Exponer Date para el template
    Date = Date;

    constructor(
        private tableService: TableService,
        private authService: AuthService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private productService: ProductService
    ) {
        this.currentUser = this.authService.getUser();
    }

    isAdmin(): boolean {
        return this.currentUser?.roles?.includes('ROLE_ADMIN');
    }

    ngOnInit(): void {
        // Carga inicial sin polling automático
        this.subs.push(
            this.useTablesQuery.useAllTables({
                refetchInterval: false,
                staleTime: Infinity,
                refetchOnWindowFocus: false
            }).subscribe(state => {
                if (state.data) {
                    this.applyTables(state.data);
                }
                // Solo mostrar loading si no hay datos stale
                this.loadingTables = state.isLoading && !state.isStale;
                if (state.error) {
                    console.error('❌ Error loading tables', state.error);
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    private applyTables(tables: RestaurantTable[]): void {
        this.salonTables = tables
            .filter(t => t.name.trim().startsWith('S'))
            .sort((a, b) => this.extractNumber(a.name) - this.extractNumber(b.name));
        this.patioTables = tables
            .filter(t => t.name.trim().startsWith('P'))
            .sort((a, b) => this.extractNumber(a.name) - this.extractNumber(b.name));
        this.cdr.detectChanges();
    }

    // Helper to extract numeric part from a table name (e.g., "S12" -> 12)
    extractNumber(name: string): number {
        return parseInt(name.replace(/\D/g, ''), 10) || 0;
    }

    // TrackBy function for *ngFor to improve rendering performance
    trackByTableId(index: number, table: RestaurantTable): number {
        return table.id;
    }

    selectTable(table: RestaurantTable): void {
        console.log('🔍 Mesa seleccionada:', table.name, 'Estado:', table.status);
        this.selectedTable = table;

        // Regla: El Admin solo interactúa con mesas 'WAITING_PAYMENT'
        if (this.isAdmin() && table.status !== 'WAITING_PAYMENT') {
            alert('Dashboard de Admin: Modo solo lectura para este estado.');
            return;
        }

        if (table.status === 'AVAILABLE') {
            if (confirm(`¿Abrir mesa ${table.name}?`)) {
                this.tableService.occupyTable(table.id).subscribe(() => {
                    this.useTablesQuery.invalidateTables();
                    this.openProductModal(table);
                });
            }
        } else if (table.status === 'OCCUPIED') {
            console.log('📋 Abriendo modal de productos para mesa OCCUPIED');
            this.openProductModal(table);
        } else if (table.status === 'READY_TO_KITCHEN') {
            if (confirm(`¿Enviar pedido de mesa ${table.name} a cocina?`)) {
                this.tableService.sendToKitchen(table.id).subscribe(() => {
                    this.useTablesQuery.invalidateTables();
                });
            }
        } else if (table.status === 'READY') {
            if (confirm(`¿Marcar mesa ${table.name} como SERVIDA?`)) {
                this.tableService.serveTable(table.id).subscribe(() => {
                    this.useTablesQuery.invalidateTables();
                });
            }
        } else if (table.status === 'SERVING') {
            if (confirm(`¿Solicitar cuenta para la mesa ${table.name}?`)) {
                this.tableService.requestBill(table.id).subscribe(() => {
                    this.useTablesQuery.invalidateTables();
                });
            }
        } else if (table.status === 'WAITING_PAYMENT') {
            if (this.isAdmin()) {
                this.confirmarCobro(table);
            } else {
                alert('Esperando que Administración confirme el pago...');
            }
        } else if (table.status === 'WAITING_KITCHEN' || table.status === 'PREPARING') {
            alert(`Mesa ${table.name} en proceso en cocina (${table.status})...`);
        } else {
            if (confirm(`¿Desea liberar la mesa ${table.name}?`)) {
                this.tableService.freeTable(table.id).subscribe(() => {
                    this.useTablesQuery.invalidateTables();
                });
            }
        }
    }

    desocuparMesa(table: RestaurantTable): void {
        if (confirm(`¿Desocupar la mesa ${table.name}?`)) {
            this.tableService.freeTable(table.id).subscribe({
                next: () => {
                    this.useTablesQuery.invalidateTables();
                    alert(`Mesa ${table.name} desocupada exitosamente`);
                },
                error: (err: any) => {
                    console.error('Error al desocupar mesa:', err);
                    alert('Error al desocupar la mesa');
                }
            });
        }
    }

    cancelarPedido(table: RestaurantTable): void {
        if (confirm(`¿Cancelar el pedido de la mesa ${table.name}? Esto liberará la mesa.`)) {
            this.tableService.cancelOrder(table.id).subscribe({
                next: () => {
                    this.useTablesQuery.invalidateTables();
                    alert(`Pedido de mesa ${table.name} cancelado exitosamente`);
                },
                error: (err: any) => {
                    console.error('Error al cancelar pedido:', err);
                    alert('Error al cancelar el pedido: ' + (err?.error || 'Error desconocido'));
                }
            });
        }
    }

    confirmarCobro(table: RestaurantTable): void {
        this.selectedTableForPayment = table;
        this.tableService.getOrderDetails(table.id).subscribe({
            next: (order) => {
                this.currentOrderForPayment = order;
                this.calculateTimings(order);
                this.showPaymentModal = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al obtener detalles del pedido:', err);
                alert('Error al cargar el pedido');
            }
        });
    }

    private calculateTimings(order: RestaurantOrder): void {
        if (order.createdAt) {
            const createdTime = new Date(order.createdAt).getTime();
            const now = new Date().getTime();
            const totalSeconds = Math.floor((now - createdTime) / 1000);
            
            // Aproximadamente 60% para mozo (tomar orden), 40% para cocina
            this.mozoTime = Math.floor(totalSeconds * 0.6);
            this.kitchenTime = Math.floor(totalSeconds * 0.4);
        }
    }

    onPaymentConfirm(paymentData: PaymentData): void {
        if (!this.selectedTableForPayment) return;
        
        this.lastPaymentData = paymentData;
        
        // Procesar el pago en el backend
        this.tableService.payTable(this.selectedTableForPayment.id).subscribe({
            next: () => {
                this.showPaymentModal = false;
                this.showReceipt = true;
                this.useTablesQuery.invalidateTables();
            },
            error: (err) => {
                console.error('Error al procesar pago:', err);
                alert('Error al procesar el pago');
            }
        });
    }

    onPaymentClose(): void {
        this.showPaymentModal = false;
        this.selectedTableForPayment = null;
        this.currentOrderForPayment = null;
    }

    onReceiptClose(): void {
        this.showReceipt = false;
        this.lastPaymentData = null;
    }

    printReceipt(): void {
        window.print();
    }

    mostrarMensajeCobro(): void {
        alert('El administrador es responsable de confirmar los cobros');
    }

    /**
     * Actualiza manualmente el estado de las mesas
     */
    actualizarMesas(): void {
        this.loadingTables = true;
        this.useTablesQuery.invalidateTables();
        // El loading se desactivará cuando lleguen los datos via subscription
    }

    logout(): void {
        if (confirm('¿Cerrar sesión?')) {
            sessionStorage.removeItem('user');
            this.router.navigate(['/login']);
        }
    }

    confirmOrder(): void {
        if (!this.selectedTable) return;

        // Convertir tempOrder a lista de items para el backend
        const items = Object.keys(this.tempOrder).map(id => ({
            productId: parseInt(id),
            quantity: this.tempOrder[parseInt(id)]
        }));

        if (items.length === 0) {
            alert('Debe seleccionar al menos un producto');
            return;
        }

        this.tableService.confirmTable(this.selectedTable.id, items).subscribe({
            next: (response) => {
                console.log('✅ Pedido confirmado:', response);
                this.closeProductModal();
                this.useTablesQuery.invalidateTables();
                alert('Pedido confirmado exitosamente');
            },
            error: (err) => {
                console.error('❌ Error al confirmar pedido:', err);
                alert('Error al confirmar pedido: ' + (err?.error || err?.message || 'Error desconocido'));
            }
        });
    }

    // Open modal showing available products for the selected table
    private openProductModal(table: RestaurantTable): void {
        console.log('🚀 openProductModal llamado para:', table.name);
        this.selectedTable = table;
        this.menuModalOpen = true;
        console.log('✅ menuModalOpen =', this.menuModalOpen);
        this.tempOrder = {}; // Resetear pedido al abrir
        this.productService.getAllProducts().subscribe(
            prods => {
                console.log('📦 Productos cargados:', prods.length);
                this.products = prods;
                this.groupProductsByCategory(prods);
                // Seleccionar la primera categoría por defecto
                if (this.categories.length > 0) {
                    this.selectedCategory = this.categories[0];
                    console.log('📁 Categoría seleccionada:', this.selectedCategory);
                }
                this.cdr.detectChanges();
            },
            err => console.error('Error loading products', err)
        );
    }

    selectCategory(cat: string): void {
        this.selectedCategory = cat;
    }

    // Métodos para el modal de productos
    categories: string[] = [];

    addProduct(prod: Product): void {
        if (!prod.id) return;
        this.tempOrder[prod.id] = (this.tempOrder[prod.id] || 0) + 1;
    }

    removeProduct(prod: Product): void {
        if (!prod.id || !this.tempOrder[prod.id]) return;
        this.tempOrder[prod.id]--;
        if (this.tempOrder[prod.id] === 0) {
            delete this.tempOrder[prod.id];
        }
    }

    getProductQuantity(prodId?: number): number {
        return prodId ? (this.tempOrder[prodId] || 0) : 0;
    }

    getFilteredProducts(): Product[] {
        let filtered = this.products;
        
        // Filtrar por categoría
        if (this.selectedCategory) {
            filtered = filtered.filter(p => p.category?.name === this.selectedCategory);
        }
        
        // Filtrar por texto de búsqueda
        if (this.searchText && this.searchText.trim()) {
            const searchLower = this.searchText.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower)
            );
        }
        
        return filtered;
    }

    onSearchChange(): void {
        // Trigger change detection when search changes
        this.cdr.detectChanges();
    }

    getTotalQuantity(): number {
        return Object.values(this.tempOrder).reduce((a, b) => a + b, 0);
    }

    closeProductModal(): void {
        this.menuModalOpen = false;
        this.selectedTable = undefined;
        this.tempOrder = {};
        this.searchText = '';
        this.selectedCategory = '';
    }

    private groupProductsByCategory(prods: Product[]): void {
        this.groupedProducts = {};
        const categoriesSet = new Set<string>();
        
        prods.forEach(p => {
            const catName = p.category?.name || 'Otros';
            if (!this.groupedProducts[catName]) {
                this.groupedProducts[catName] = [];
            }
            this.groupedProducts[catName].push(p);
            categoriesSet.add(catName);
        });
        
        this.categories = Array.from(categoriesSet);
    }
}
