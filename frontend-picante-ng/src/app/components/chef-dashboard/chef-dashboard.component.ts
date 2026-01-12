import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService, RestaurantTable, RestaurantOrder, OrderItem } from '../../services/table.service';
import { UseTablesQuery } from '../../services/use-tables.query';
import { BotonActualizarComponent } from '../boton-actualizar/boton-actualizar.component';
import { Subscription, interval } from 'rxjs';
import { TimerComponent } from '../timer/timer.component';

export interface TableWithOrder extends RestaurantTable {
    orderDetails?: RestaurantOrder;
    itemsLoaded?: boolean;
}

@Component({
    selector: 'app-chef-dashboard',
    standalone: true,
    imports: [CommonModule, TimerComponent, BotonActualizarComponent],
    templateUrl: './chef-dashboard.component.html',
    styleUrls: ['./chef-dashboard.component.css']
})
export class ChefDashboardComponent implements OnInit, OnDestroy {
    orders: TableWithOrder[] = [];
    private subs: Subscription[] = [];
    private failedOrderIds = new Set<number>();
    cargandoPedidos: boolean = false;
    private autoRefreshSubscription: Subscription | null = null;

    // Stats para el gráfico
    stats = { waiting: 0, preparing: 0, ready: 0 };

    private useTablesQuery = inject(UseTablesQuery);

    constructor(
        private tableService: TableService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // Carga inicial sin polling automático
        this.subs.push(
            this.useTablesQuery.useAllTables({
                refetchInterval: false,
                staleTime: Infinity,
                refetchOnWindowFocus: false
            }).subscribe(state => {
                if (state.data) {
                    this.applyOrders(state.data);
                }
            })
        );

        // Inicia temporizador de 5 segundos para actualización automática
        this.startAutoRefresh();
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
        this.stopAutoRefresh();
    }

    private startAutoRefresh(): void {
        if (this.autoRefreshSubscription) {
            this.autoRefreshSubscription.unsubscribe();
        }
        
        this.autoRefreshSubscription = interval(5000).subscribe(() => {
            this.useTablesQuery.invalidateTables();
        });

        this.subs.push(this.autoRefreshSubscription);
    }

    private stopAutoRefresh(): void {
        if (this.autoRefreshSubscription) {
            this.autoRefreshSubscription.unsubscribe();
            this.autoRefreshSubscription = null;
        }
    }

    private applyOrders(tables: RestaurantTable[]): void {
        const newOrders = tables.filter(t =>
            t.status === 'WAITING_KITCHEN' ||
            t.status === 'PREPARING' ||
            t.status === 'READY'
        );
        
        // Mapear pedidos existentes para mantener los detalles cargados
        const ordersMap = new Map(this.orders.map(o => [o.id, o]));
        
        this.orders = newOrders.map(order => {
            const existing = ordersMap.get(order.id);
            if (existing && existing.itemsLoaded && existing.status === order.status) {
                // Mantener los detalles ya cargados si el estado no cambió
                return { ...order, orderDetails: existing.orderDetails, itemsLoaded: true } as TableWithOrder;
            } else if (!this.failedOrderIds.has(order.id)) {
                // Nueva mesa o cambió de estado, cargar detalles solo si no falló antes
                this.tableService.getOrderDetails(order.id).subscribe({
                    next: (orderDetails) => {
                        const tableWithOrder = this.orders.find(o => o.id === order.id) as TableWithOrder;
                        if (tableWithOrder) {
                            tableWithOrder.orderDetails = orderDetails;
                            tableWithOrder.itemsLoaded = true;
                            this.failedOrderIds.delete(order.id);
                            this.cdr.detectChanges();
                        }
                    },
                    error: (err) => {
                        console.error(`Error cargando detalles de mesa ${order.id}:`, err);
                        this.failedOrderIds.add(order.id);
                    }
                });
                return order as TableWithOrder;
            } else {
                // Ya falló antes, no reintentar
                return order as TableWithOrder;
            }
        });
        
        this.calculateStats();
        this.cdr.detectChanges();
    }

    startPrep(table: TableWithOrder): void {
        // Optimistic UI: reflejar de inmediato en la lista local
        this.orders = this.orders.map(t => t.id === table.id ? ({
            ...t,
            status: 'PREPARING',
            preparationAt: new Date().toISOString()
        } as TableWithOrder) : t);
        this.cdr.detectChanges();

        this.tableService.startPreparation(table.id).subscribe({
            next: () => this.useTablesQuery.invalidateTables(),
            error: (err) => {
                console.error('❌ Error startPrep', err);
                // Re-sync estado real desde backend
                this.useTablesQuery.invalidateTables();
            }
        });
    }

    finishOrder(table: TableWithOrder): void {
        // Optimistic UI: marcar como listo localmente
        this.orders = this.orders.map(t => t.id === table.id ? ({
            ...t,
            status: 'READY'
        } as TableWithOrder) : t);
        this.cdr.detectChanges();

        this.tableService.setReady(table.id).subscribe({
            next: () => this.useTablesQuery.invalidateTables(),
            error: (err) => {
                console.error('❌ Error finishOrder', err);
                // Re-sync estado real desde backend
                this.useTablesQuery.invalidateTables();
            }
        });
    }

    calculateStats(): void {
        const total = this.orders.length || 1;
        this.stats = {
            waiting: this.orders.filter(o => o.status === 'WAITING_KITCHEN').length,
            preparing: this.orders.filter(o => o.status === 'PREPARING').length,
            ready: this.orders.filter(o => o.status === 'READY').length
        };
    }

    reloadOrders(): void {
        this.cargandoPedidos = true;
        this.failedOrderIds.clear();
        this.useTablesQuery.invalidateTables();
        // El loading se desactivará cuando lleguen los datos
        setTimeout(() => this.cargandoPedidos = false, 1500);
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'WAITING_KITCHEN': return 'bg-primary';
            case 'PREPARING': return 'bg-warning text-dark';
            case 'READY': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'WAITING_KITCHEN': return 'RECIBIDO';
            case 'PREPARING': return 'EN PREPARACIÓN';
            case 'READY': return 'LISTO PARA SERVIR';
            default: return status;
        }
    }
}
