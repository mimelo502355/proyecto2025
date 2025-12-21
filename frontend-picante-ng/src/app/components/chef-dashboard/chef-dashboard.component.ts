import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService, RestaurantTable } from '../../services/table.service';

@Component({
    selector: 'app-chef-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chef-dashboard.component.html',
    styleUrls: ['./chef-dashboard.component.css']
})
export class ChefDashboardComponent implements OnInit, OnDestroy {
    orders: RestaurantTable[] = [];
    private pollInterval: any;
    private timerInterval: any;
    now: Date = new Date();

    // Stats para el gráfico
    stats = { waiting: 0, preparing: 0, ready: 0 };

    constructor(
        private tableService: TableService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.loadOrders();
        // Poll every 2 seconds (balanced)
        this.pollInterval = setInterval(() => this.loadOrders(), 2000);
        // Timer every second (visual only)
        this.timerInterval = setInterval(() => (this.now = new Date()), 1000);
    }

    ngOnDestroy(): void {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    loadOrders(): void {
        this.tableService.getAllTables().subscribe(
            tables => {
                // El chef solo ve mesas que están en WAITING_KITCHEN, PREPARING o READY
                this.orders = tables.filter(t =>
                    t.status === 'WAITING_KITCHEN' ||
                    t.status === 'PREPARING' ||
                    t.status === 'READY'
                );
                this.calculateStats();
                this.cdr.detectChanges();
            },
            error => console.error('❌ Error loading chef orders:', error)
        );
    }

    startPrep(table: RestaurantTable): void {
        this.tableService.startPreparation(table.id).subscribe(() => this.loadOrders());
    }

    finishOrder(table: RestaurantTable): void {
        this.tableService.setReady(table.id).subscribe(() => this.loadOrders());
    }

    calculateStats(): void {
        const total = this.orders.length || 1;
        this.stats = {
            waiting: this.orders.filter(o => o.status === 'WAITING_KITCHEN').length,
            preparing: this.orders.filter(o => o.status === 'PREPARING').length,
            ready: this.orders.filter(o => o.status === 'READY').length
        };
    }

    getPrepTime(preparationAt?: string): string {
        if (!preparationAt) return '00:00';
        const start = new Date(preparationAt).getTime();
        const diff = this.now.getTime() - start;
        if (diff < 0) return '00:00';
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    private pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
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
