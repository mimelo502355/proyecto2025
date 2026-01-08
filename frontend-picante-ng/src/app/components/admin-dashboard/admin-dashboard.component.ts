import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { SocketService } from '../../services/socket.service';
import { ProductService } from '../../services/product';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    insumos: any[] = [];
    tables: any[] = [];
    deliveryOrders: any[] = [];
    attendance: any[] = [];
    products: any[] = [];
    currentUser: any = null; // Inicializar como null en lugar de undefined
    activeSection: string = 'inventory'; // 'inventory', 'tables', 'delivery', 'collaborators', 'products'

    // Billing Modal properties
    showBillModal: boolean = false;
    selectedTable: any = null;
    currentOrder: any = null;

    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private productService = inject(ProductService);

    // Waiter integration properties
    showProductModal: boolean = false;
    groupedProducts: { [key: string]: any[] } = {};
    filteredGroupedProducts: { [key: string]: any[] } = {};
    selectedCategory: string = '';
    tempOrder: { [key: number]: number } = {};
    activeTable: any = null;
    now: Date = new Date();

    private clockSub: Subscription | null = null;
    private visibilityHandler: any;
    private storageHandler: any;
    private wsSub: Subscription | null = null;

    // Delivery creation properties
    showDeliveryModal: boolean = false;
    searchFilter: string = '';
    newDelivery: any = {
        customerName: '',
        address: '',
        phone: '',
        totalAmount: 0,
        notes: '',
        items: [] // Para guardar los productos seleccionados
    };

    ngOnInit() {
        // Asignar currentUser inmediatamente para evitar undefined en el template
        this.currentUser = this.authService.getUser() || null;
        
        if (!this.currentUser || (!this.currentUser.roles.includes('ROLE_ADMIN') && !this.currentUser.roles.includes('ROLE_SUPER_ADMIN'))) {
            this.router.navigate(['/login']);
            return;
        }
        
        // Usar setTimeout para evitar cambios durante el ciclo de detección actual
        setTimeout(() => {
            this.refreshData();
            this.startClock();
        }, 0);

        // Pause clock when tab/window is not visible to save resources
        this.visibilityHandler = () => {
            if (document.hidden) {
                this.stopClock();
            } else {
                // refresh immediately when returning
                this.refreshData();
                this.startClock();
                // Usar setTimeout en lugar de detectChanges directo
                setTimeout(() => this.cdr.markForCheck(), 0);
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);

        // Listen storage changes so multiple tabs/browsers can react to session/role updates
        this.storageHandler = (ev: StorageEvent) => {
            if (ev.key === 'user') {
                const stored = this.authService.getUser();
                if (!stored) {
                    // User logged out elsewhere
                    alert('La sesión ha cambiado en otra pestaña o navegador. Por favor inicie sesión nuevamente.');
                    this.logout();
                } else if (stored.username === this.currentUser?.username) {
                    // Same user - check if admin access is still valid
                    if (!stored.roles?.includes('ROLE_ADMIN') && !stored.roles?.includes('ROLE_SUPER_ADMIN')) {
                        alert('Sus permisos han cambiado. Redirigiendo a inicio de sesión.');
                        this.logout();
                    } else {
                        // Update roles if changed
                        this.currentUser = stored;
                        this.refreshData();
                    }
                }
                // If it's a different user, ignore the event (another tab with different user)
            }
        };
        window.addEventListener('storage', this.storageHandler);

        // Subscribe to real-time table updates
        const socket = inject(SocketService);
        this.wsSub = socket.subscribe('/topic/tables').subscribe(() => {
            // If user is viewing tables, refresh tables only; otherwise refresh minimal data
            if (this.activeSection === 'tables') this.loadTables();
            else this.refreshData();
            // Usar setTimeout en lugar de detectChanges directo
            setTimeout(() => this.cdr.markForCheck(), 0);
        });
    }

    ngOnDestroy() {
        this.stopClock();
        if (this.visibilityHandler) document.removeEventListener('visibilitychange', this.visibilityHandler);
        if (this.storageHandler) window.removeEventListener('storage', this.storageHandler);
        if (this.wsSub) this.wsSub.unsubscribe();
    }

    private startClock() {
        if (this.clockSub) return;
        this.clockSub = interval(1000).subscribe(() => {
            this.now = new Date();
            // Solo marcar para verificación en lugar de forzar detección
            this.cdr.markForCheck();
        });
    }

    private stopClock() {
        if (this.clockSub) {
            this.clockSub.unsubscribe();
            this.clockSub = null;
        }
    }

    refreshData() {
        if (!this.verifyUserSession()) return;
        if (this.activeSection === 'inventory') this.loadInsumos();
        if (this.activeSection === 'tables') this.loadTables();
        if (this.activeSection === 'delivery') this.loadDeliveryOrders();
        if (this.activeSection === 'collaborators') this.loadAttendance();
        if (this.activeSection === 'products') this.loadProducts();
    }

    verifyUserSession(): boolean {
        const storedUser = this.authService.getUser();
        if (!storedUser || storedUser.username !== this.currentUser.username) {
            alert('La sesión ha cambiado en otra pestaña. Por favor inicie sesión nuevamente.');
            this.logout();
            return false;
        }
        return true;
    }

    setSection(section: string) {
        this.activeSection = section;
        this.refreshData();
    }

    // --- INVENTORY ---
    loadInsumos() {
        this.http.get<any[]>('http://localhost:8080/api/inventory').subscribe(
            data => this.insumos = data,
            err => console.error('Error loading inventory', err)
        );
    }

    updateInsumo(ins: any) {
        const newStock = prompt(`Actualizar stock para ${ins.name}:`, ins.stock);
        if (newStock !== null) {
            this.http.put(`http://localhost:8080/api/inventory/${ins.id}`, { ...ins, stock: parseFloat(newStock) }).subscribe(
                () => this.loadInsumos(),
                err => alert('Error al actualizar stock')
            );
        }
    }

    // --- TABLES ---
    loadTables() {
        this.http.get<any[]>('http://localhost:8080/api/tables').subscribe(
            data => this.tables = data,
            err => console.error('Error loading tables', err)
        );
    }

    viewBill(table: any) {
        this.selectedTable = table;
        this.http.get<any>(`http://localhost:8080/api/tables/${table.id}/order-details`).subscribe(
            order => {
                this.currentOrder = order;
                this.showBillModal = true;
            },
            err => alert('Error al cargar detalles del pedido')
        );
    }

    // --- WAITER FUNCTIONS FOR ADMIN ---
    selectTable(table: any) {
        // Admin only handles Payment (Cashier role). 
        // Other states (Occupying, Ordering, Serving) are strictly for Waiters.
        if (table.status === 'WAITING_PAYMENT') {
            this.activeTable = table;
            this.viewBill(table);
        }
    }

    openProductModal(table: any) {
        this.activeTable = table;
        this.showProductModal = true;
        this.tempOrder = {};
        this.loadProductsForModal();
    }

    loadProductsForModal() {
        // Usar el servicio de productos que ya maneja el archivo JSON
        this.productService.getAllProducts().subscribe({
            next: (prods: any[]) => {
                console.log('✅ AdminDashboard: Productos cargados:', prods.length);
                this.groupProducts(prods);
                if (this.categories.length > 0) this.selectedCategory = this.categories[0];
            },
            error: (err: any) => {
                console.error('❌ AdminDashboard: Error cargando productos:', err);
            }
        });
    }

    groupProducts(prods: any[]) {
        this.groupedProducts = {};
        console.log('🔄 AdminDashboard: Agrupando', prods.length, 'productos');
        
        prods.forEach(p => {
            // Manejo robusto de categorías igual que en mesero
            let catName: string = 'Sin Categoría';
            
            if (p.category) {
                if (typeof p.category === 'object' && p.category.name) {
                    catName = p.category.name.trim();
                } else if (typeof p.category === 'string') {
                    catName = p.category.trim();
                }
            }
            
            if (!catName || catName.length === 0) {
                catName = 'Sin Categoría';
            }
            
            if (!this.groupedProducts[catName]) {
                this.groupedProducts[catName] = [];
            }
            this.groupedProducts[catName].push(p);
        });
        
        // Aplicar filtro inicial (sin filtro = todos los productos)
        console.log('🔧 AdminDashboard: Aplicando filtro inicial...');
        this.applyFilter();
        
        // Log para debugging
        Object.keys(this.groupedProducts).forEach(cat => {
            console.log(`📋 AdminDashboard - Categoría: ${cat}, Productos: ${this.groupedProducts[cat].length}`);
        });
        console.log('✅ AdminDashboard - Total productos agrupados:', 
            Object.values(this.groupedProducts).reduce((total, arr) => total + arr.length, 0));
    }

    get categories(): string[] { return Object.keys(this.groupedProducts); }

    addToOrder(prod: any) {
        this.tempOrder[prod.id] = (this.tempOrder[prod.id] || 0) + 1;
    }

    removeFromOrder(prod: any) {
        if (this.tempOrder[prod.id] > 0) {
            this.tempOrder[prod.id]--;
            if (this.tempOrder[prod.id] === 0) delete this.tempOrder[prod.id];
        }
    }

    getTempQty(prodId: number) { return this.tempOrder[prodId] || 0; }

    getTotalTempItems() { return Object.values(this.tempOrder).reduce((a, b) => a + b, 0); }

    confirmTableOrder() {
        const items = Object.keys(this.tempOrder).map(id => ({
            productId: parseInt(id),
            quantity: this.tempOrder[parseInt(id)]
        }));
        this.http.post(`http://localhost:8080/api/tables/${this.activeTable.id}/confirm`, items, { responseType: 'text' }).subscribe(() => {
            this.showProductModal = false;
            this.loadTables();
            alert('Pedido confirmado');
        });
    }

    // Timer Helpers
    getElapsedTime(occupiedAt?: string): string {
        if (!occupiedAt) return '00:00';
        const start = new Date(occupiedAt).getTime();
        const diff = this.now.getTime() - start;
        if (diff < 0) return '00:00';
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    closeBillModal() {
        this.showBillModal = false;
        this.currentOrder = null;
        this.selectedTable = null;
    }

    confirmPayment() {
        if (!this.selectedTable) return;
        this.http.post(`http://localhost:8080/api/tables/${this.selectedTable.id}/pay`, {}, { responseType: 'text' }).subscribe(
            () => {
                this.closeBillModal();
                this.loadTables();
            },
            err => {
                console.error('Error processing payment', err);
                if (err.status === 403) {
                    alert('Acceso Denegado: No tienes permisos de Administrador para cobrar. Verifica tu sesión.');
                } else {
                    alert('Error al procesar pago');
                }
            }
        );
    }

    printReceipt() {
        window.print();
    }

    // --- DELIVERY ---
    loadDeliveryOrders() {
        this.http.get<any[]>('http://localhost:8080/api/delivery').subscribe(
            data => {
                // Filter duplicates just in case
                this.deliveryOrders = data.filter((v, i, a) => a.findIndex(v2 => (v2.id === v.id)) === i);
            },
            err => console.error('Error loading delivery', err)
        );
    }

    updateDeliveryStatus(orderId: number, status: string) {
        this.http.patch(`http://localhost:8080/api/delivery/${orderId}/status?status=${status}`, {}).subscribe(
            () => this.loadDeliveryOrders(),
            err => alert('Error al actualizar estado')
        );
    }

    // --- DELIVERY TICKET ---
    showDeliveryTicket: boolean = false;
    deliveryToTicket: any = null;

    prepareDispatch(order: any) {
        this.deliveryToTicket = order;
        this.showDeliveryTicket = true;
    }

    printDeliveryTicket() {
        // Simple window print for now, ideally print specific div
        const printContent = document.getElementById('delivery-ticket-print');
        if (printContent) {
            // For a quick solution, we print the whole window but the user can select.
            // Or ideally we open a popup. For this MVP, window.print() is acceptable
            // as the modal is the dominant element.
            window.print();
        }
    }

    confirmDispatch() {
        if (this.deliveryToTicket) {
            this.updateDeliveryStatus(this.deliveryToTicket.id, 'EN_CAMINO');
            this.showDeliveryTicket = false;
            this.deliveryToTicket = null;
        }
    }

    // --- ATTENDANCE ---
    loadAttendance() {
        this.http.get<any[]>('http://localhost:8080/api/attendance').subscribe(
            data => this.attendance = data,
            err => console.error('Error loading attendance', err)
        );
    }

    // --- PRODUCTS ---
    loadProducts() {
        this.http.get<any[]>('http://localhost:8080/api/products').subscribe(
            data => this.products = data,
            err => console.error('Error loading products', err)
        );
    }

    openDeliveryModal() {
        this.searchFilter = ''; // Reset search filter
        console.log('🎯 AdminDashboard: Abriendo modal de delivery');
        this.loadProductsForModal(); // Cargamos la carta agrupada por categorías
        this.newDelivery = {
            customerName: '',
            address: '',
            phone: '',
            totalAmount: 0,
            notes: '',
            items: []
        };
        this.showDeliveryModal = true;
    }

    closeDeliveryModal() {
        this.showDeliveryModal = false;
    }

    // --- NEW DELIVERY CREATION ---
    addToDeliveryCart(product: any) {
        const existing = this.newDelivery.items.find((i: any) => i.productId === product.id);
        if (existing) {
            existing.quantity++;
            existing.subtotal = existing.quantity * existing.unitPrice;
        } else {
            this.newDelivery.items.push({
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.price,
                subtotal: product.price
            });
        }
        this.calculateDeliveryTotal();
    }

    removeFromDeliveryCart(product: any) {
        const index = this.newDelivery.items.findIndex((i: any) => i.productId === product.id);
        if (index !== -1) {
            this.newDelivery.items[index].quantity--;
            if (this.newDelivery.items[index].quantity <= 0) {
                this.newDelivery.items.splice(index, 1);
            } else {
                this.newDelivery.items[index].subtotal = this.newDelivery.items[index].quantity * this.newDelivery.items[index].unitPrice;
            }
        }
        this.calculateDeliveryTotal();
    }

    getDeliveryQty(productId: number): number {
        const item = this.newDelivery.items.find((i: any) => i.productId === productId);
        return item ? item.quantity : 0;
    }

    calculateDeliveryTotal() {
        this.newDelivery.totalAmount = this.newDelivery.items.reduce((acc: number, item: any) => acc + item.subtotal, 0);
    }

    createDelivery() {
        // Concatenamos los productos a las notas para que el chef sepa qué preparar
        const itemsDetail = this.newDelivery.items
            .map((i: any) => `${i.quantity}x ${i.productName}`)
            .join(', ');

        const finalPayload = {
            ...this.newDelivery,
            notes: `[PRODUCTOS: ${itemsDetail}] - ${this.newDelivery.notes}`
        };

        this.http.post('http://localhost:8080/api/delivery', finalPayload).subscribe(
            () => {
                this.closeDeliveryModal();
                this.loadDeliveryOrders();
            },
            err => alert('Error al crear pedido de delivery')
        );
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    // Métodos de filtrado de búsqueda
    onSearchChange(event?: Event) {
        if (event && event.target) {
            this.searchFilter = (event.target as HTMLInputElement).value;
        }
        console.log('🔍 Admin: Filtro cambiado a:', `"${this.searchFilter}"`);
        this.applyFilter();
        this.cdr.detectChanges();
    }

    clearSearch() {
        console.log('🧹 Admin: Limpiando filtro');
        this.searchFilter = '';
        this.applyFilter();
        this.cdr.detectChanges();
    }

    private applyFilter() {
        console.log('⚡ Admin: Aplicando filtro con término:', `"${this.searchFilter}"`);
        
        if (!this.searchFilter || this.searchFilter.trim() === '') {
            // Sin filtro: mostrar todos los productos
            this.filteredGroupedProducts = { ...this.groupedProducts };
            console.log('✅ Admin: Sin filtro - mostrando todas las categorías con todos los productos');
        } else {
            // Con filtro: buscar productos globalmente en todas las categorías
            this.filteredGroupedProducts = {};
            const searchText = this.searchFilter.toLowerCase().trim();
            
            let totalMatches = 0;
            
            // Filtrar productos en cada categoría y solo incluir categorías con resultados
            Object.keys(this.groupedProducts).forEach(category => {
                const filteredProducts = this.groupedProducts[category].filter(product => {
                    const nameMatch = product.name && product.name.toLowerCase().includes(searchText);
                    const descMatch = product.description && product.description.toLowerCase().includes(searchText);
                    return nameMatch || descMatch;
                });
                
                // Solo incluir la categoría SI tiene productos que coincidan con la búsqueda
                if (filteredProducts.length > 0) {
                    this.filteredGroupedProducts[category] = filteredProducts;
                    totalMatches += filteredProducts.length;
                    console.log(`📋 Admin: Categoría "${category}" tiene ${filteredProducts.length} productos que coinciden`);
                }
            });
            
            const categoriesWithResults = Object.keys(this.filteredGroupedProducts).length;
            console.log(`✅ Admin: Búsqueda completada - ${totalMatches} productos en ${categoriesWithResults} categorías`);
            
            if (totalMatches === 0) {
                console.log(`⚠️ Admin: No se encontraron productos con: "${searchText}"`);
            }
        }
        
        // Asegurar que hay una categoría seleccionada
        if (!this.selectedCategory || !this.filteredGroupedProducts.hasOwnProperty(this.selectedCategory)) {
            const availableCategories = Object.keys(this.filteredGroupedProducts);
            if (availableCategories.length > 0) {
                this.selectedCategory = availableCategories[0];
                console.log('🏷️ Admin: Categoría seleccionada:', this.selectedCategory);
            }
        }
    }

    get salonTables() { return this.tables.filter(t => t.name.startsWith('S')); }
    get patioTables() { return this.tables.filter(t => t.name.startsWith('P')); }
}
