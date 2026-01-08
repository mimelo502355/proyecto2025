import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // needed for *ngIf, *ngFor
import { TableService, RestaurantTable } from '../../services/table.service';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../services/product';

@Component({
    selector: 'app-mesero-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mesero-dashboard.component.html',
    styleUrls: ['./mesero-dashboard.component.css']
})
export class MeseroDashboardComponent implements OnInit, OnDestroy {
    // Comentario para forzar recompilación y verificar tipos corregidos
    salonTables: RestaurantTable[] = [];
    patioTables: RestaurantTable[] = [];
    private timerInterval: any;
    private pollInterval: any;
    now: Date = new Date();
    // Modal state
    showProductModal: boolean = false;
    selectedTable?: RestaurantTable;
    products: Product[] = [];
    groupedProducts: { [key: string]: Product[] } = {};
    selectedCategory: string = '';
    // Estructura para el pedido temporal: { [productId]: cantidad }
    tempOrder: { [key: number]: number } = {};
    currentUser: any = null;

    // Billing modal
    showBillModal: boolean = false;
    currentOrder: any = null;

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
        this.loadTables();
        // Poll backend for fresh data every 2 seconds (balanced for realtime & performance)
        this.pollInterval = setInterval(() => this.loadTables(), 2000);
        // Update visual clock every second for smooth timers
        this.timerInterval = setInterval(() => (this.now = new Date()), 1000);
    }

    ngOnDestroy(): void {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    loadTables(): void {
        this.tableService.getAllTables().subscribe(
            tables => {
                // Separate salon (S) and patio (P) tables
                this.salonTables = tables
                    .filter(t => t.name.trim().startsWith('S'))
                    .sort((a, b) => this.extractNumber(a.name) - this.extractNumber(b.name));
                this.patioTables = tables
                    .filter(t => t.name.trim().startsWith('P'))
                    .sort((a, b) => this.extractNumber(a.name) - this.extractNumber(b.name));
                // Ensure view updates
                this.cdr.detectChanges();
            },
            error => console.error('❌ Error loading tables:', error)
        );
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
        this.selectedTable = table;

        // Regla: El Admin solo interactúa con mesas 'WAITING_PAYMENT'
        if (this.isAdmin() && table.status !== 'WAITING_PAYMENT') {
            alert('Dashboard de Admin: Modo solo lectura para este estado.');
            return;
        }

        if (table.status === 'AVAILABLE') {
            if (confirm(`¿Abrir mesa ${table.name}?`)) {
                this.tableService.occupyTable(table.id).subscribe(() => {
                    this.loadTables();
                    this.openProductModal(table);
                });
            }
        } else if (table.status === 'OCCUPIED') {
            this.openProductModal(table);
        } else if (table.status === 'READY_TO_KITCHEN') {
            if (confirm(`¿Enviar pedido de mesa ${table.name} a cocina?`)) {
                this.tableService.sendToKitchen(table.id).subscribe(() => {
                    this.loadTables();
                });
            }
        } else if (table.status === 'READY') {
            if (confirm(`¿Marcar mesa ${table.name} como SERVIDA?`)) {
                this.tableService.serveTable(table.id).subscribe(() => {
                    this.loadTables();
                });
            }
        } else if (table.status === 'SERVING') {
            if (confirm(`¿Solicitar cuenta para la mesa ${table.name}?`)) {
                this.tableService.requestBill(table.id).subscribe(() => {
                    this.loadTables();
                });
            }
        } else if (table.status === 'WAITING_PAYMENT') {
            if (this.isAdmin()) {
                this.viewBill(table);
            } else {
                alert('Esperando que Administración confirme el pago...');
            }
        } else if (table.status === 'WAITING_KITCHEN' || table.status === 'PREPARING') {
            alert(`Mesa ${table.name} en proceso en cocina (${table.status})...`);
        } else {
            if (confirm(`¿Desea liberar la mesa ${table.name}?`)) {
                this.tableService.freeTable(table.id).subscribe(() => {
                    this.loadTables();
                });
            }
        }
    }

    logout(): void {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('user');
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

        this.tableService.confirmTable(this.selectedTable.id, items).subscribe(() => {
            this.closeProductModal();
            this.loadTables();
        });
    }

    viewBill(table: RestaurantTable): void {
        this.selectedTable = table;
        this.tableService.getOrderDetails(table.id).subscribe(order => {
            this.currentOrder = order;
            this.showBillModal = true;
            this.cdr.detectChanges();
        });
    }

    closeBillModal(): void {
        this.showBillModal = false;
        this.currentOrder = null;
        this.selectedTable = undefined;
    }

    confirmPayment(): void {
        if (!this.selectedTable) return;
        if (confirm(`Confirmar pago de S/. ${this.currentOrder?.totalAmount}?`)) {
            this.tableService.payTable(this.selectedTable.id).subscribe(() => {
                this.closeBillModal();
                this.loadTables();
            });
        }
    }

    printBill(): void {
        window.print();
    }

    // Open modal showing available products for the selected table
    private openProductModal(table: RestaurantTable): void {
        this.selectedTable = table;
        this.showProductModal = true;
        this.tempOrder = {}; // Resetear pedido al abrir
        this.productService.getAllProducts().subscribe(
            prods => {
                this.products = prods;
                this.groupProductsByCategory(prods);
                // Seleccionar la primera categoría por defecto
                if (this.categories.length > 0) {
                    this.selectedCategory = this.categories[0];
                }
            },
            err => console.error('Error loading products', err)
        );
    }

    selectCategory(cat: string): void {
        this.selectedCategory = cat;
    }

    addToOrder(prod: Product): void {
        if (!prod.id) return;
        this.tempOrder[prod.id] = (this.tempOrder[prod.id] || 0) + 1;
    }

    removeFromOrder(prod: Product): void {
        if (!prod.id || !this.tempOrder[prod.id]) return;
        this.tempOrder[prod.id]--;
        if (this.tempOrder[prod.id] === 0) {
            delete this.tempOrder[prod.id];
        }
    }

    getQuantity(prodId?: number): number {
        return prodId ? (this.tempOrder[prodId] || 0) : 0;
    }

    getTotalItems(): number {
        return Object.values(this.tempOrder).reduce((a, b) => a + b, 0);
    }

    private groupProductsByCategory(prods: Product[]): void {
        this.groupedProducts = {};
        prods.forEach(p => {
            const catName = p.category?.name || 'Otros';
            if (!this.groupedProducts[catName]) {
                this.groupedProducts[catName] = [];
            }
            this.groupedProducts[catName].push(p);
        });
    }

    // Helper para obtener las llaves (categorías) del objeto agrupado
    get categories(): string[] {
        return Object.keys(this.groupedProducts);
    }

    // Close the product modal
    closeProductModal(): void {
        this.showProductModal = false;
        this.selectedTable = undefined;
        this.products = [];
    }

    getElapsedTime(occupiedAt?: string): string {
        if (!occupiedAt) return '00:00';
        const start = new Date(occupiedAt).getTime();
        const diff = this.now.getTime() - start;
        if (diff < 0) return '00:00';
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    getTimerClass(occupiedAt?: string): string {
        if (!occupiedAt) return '';
        const start = new Date(occupiedAt).getTime();
        const diffMinutes = (this.now.getTime() - start) / 60000;
        return diffMinutes >= 30 ? 'timer-red' : 'timer-orange';
    }

    private pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }
}
/ /   M e j o r a r   U I   d e l   d a s h b o a r d   d e l   m e s e r o  
 