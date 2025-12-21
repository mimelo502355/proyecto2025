
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importante para *ngFor, *ngIf
import { TableService, RestaurantTable } from '../../services/table.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-mesero-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mesero-dashboard.component.html',
    styleUrls: ['./mesero-dashboard.component.css']
})
export class MeseroDashboardComponent implements OnInit, OnDestroy {
    salonTables: RestaurantTable[] = [];
    patioTables: RestaurantTable[] = [];
    timerInterval: any;
    now: Date = new Date();

    constructor(private tableService: TableService, private router: Router, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.loadTables();

        // Polling: Actualizar mesas cada 5 segundos
        setInterval(() => {
            this.loadTables();
        }, 5000);

        // Actualizar el cronómetro cada segundo
        this.timerInterval = setInterval(() => {
            this.now = new Date();
        }, 1000);
    }

    ngOnDestroy(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    loadTables(): void {
        this.tableService.getAllTables().subscribe(tables => {
            // Filtrar por nombre para separar zonas
            this.salonTables = tables.filter(t => t.name.trim().startsWith('S')).sort((a, b) => this.extractNumber(a.name) - this.extractNumber(b.name));
            this.patioTables = tables.filter(t => t.name.trim().startsWith('P')).sort((a, b) => this.extractNumber(a.name) - this.extractNumber(b.name));

            this.cdr.detectChanges(); // Vital para que se refresque la vista
        }, error => {
            console.error('❌ Error cargando mesas:', error);
        });
    }

    // Para evitar parpadeos al actualizar la lista
    trackByTableId(index: number, table: RestaurantTable): number {
        return table.id;
    }

    extractNumber(name: string): number {
        return parseInt(name.replace(/\D/g, '')) || 0;
    }

    selectTable(table: RestaurantTable): void {
        if (table.status === 'AVAILABLE') {
            // Ocupar mesa (lógica temporal, luego irá a tomar pedido)
            if (confirm(`¿Ocupar mesa ${table.name} y atender?`)) {
                this.tableService.occupyTable(table.id).subscribe(() => {
                    this.loadTables();
                });
            }
        } else {
            // Ir a ver el pedido o liberar
            if (confirm(`Mesa ${table.name} ocupada. ¿Liberar mesa? (Esto es temporal)`)) {
                this.tableService.freeTable(table.id).subscribe(() => {
                    this.loadTables();
                });
            }
        }
    }

    getElapsedTime(occupiedAt?: string): string {
        if (!occupiedAt) return '00:00';

        const start = new Date(occupiedAt).getTime();
        const current = this.now.getTime();
        const diff = current - start;

        if (diff < 0) return '00:00'; // Por si acaso

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    getTimerClass(occupiedAt?: string): string {
        if (!occupiedAt) return '';
        const start = new Date(occupiedAt).getTime();
        const diff = (this.now.getTime() - start) / 60000; // minutos

        return diff >= 30 ? 'timer-red' : 'timer-orange';
    }

    private pad(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }
}
