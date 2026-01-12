import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
// import { SocketService } from './socket.service'; // DEPRECATED: No longer used with QueryClient
import { TableService, RestaurantTable } from './table.service';
import { DeliveryService, DeliveryOrder } from './delivery.service';
import { InventoryService, Ingredient } from './inventory.service';

/**
 * RealTimeService centraliza eventos en vivo para mesas, deliveries e inventario.
 * Usa websockets si están disponibles y replica el flujo vía Subjects locales
 * para actualizaciones optimistas.
 */
@Injectable({ providedIn: 'root' })
export class RealTimeService {
  // private socket = inject(SocketService); // DEPRECATED: No longer used with QueryClient
  private tableService = inject(TableService);
  private deliveryService = inject(DeliveryService);
  private inventoryService = inject(InventoryService);

  private tablesSubject = new BehaviorSubject<RestaurantTable[]>([]);
  tables$ = this.tablesSubject.asObservable();

  private deliveriesSubject = new BehaviorSubject<DeliveryOrder[]>([]);
  deliveries$ = this.deliveriesSubject.asObservable();

  private lowStockSubject = new BehaviorSubject<Ingredient | null>(null);
  lowStock$ = this.lowStockSubject.asObservable();

  connect(): void {
    // this.socket.connect(); // DEPRECATED: No longer used with QueryClient
    // Suscripción a eventos de mesas
    // this.socket.subscribe('/topic/tables', (tables: RestaurantTable[]) => {
    //   this.tablesSubject.next(tables);
    // });

    // // Suscripción a eventos de deliveries
    // this.socket.subscribe('/topic/deliveries', (orders: DeliveryOrder[]) => {
    //   this.deliveriesSubject.next(orders);
    // });

    // // Suscripción a eventos de inventario/stock
    // this.socket.subscribe('/topic/inventory', (payload: { ingredient: Ingredient }) => {
    //   if (payload?.ingredient) {
    //     this.lowStockSubject.next(payload.ingredient);
    //   }
    // });
  }

  /**
   * Sincroniza mesas desde backend y emite.
   */
  syncTables(): Observable<RestaurantTable[]> {
    return this.tableService.getAllTables().pipe(
      tap((tables) => this.tablesSubject.next(tables))
    );
  }

  /**
   * Sincroniza deliveries desde backend y emite.
   */
  syncDeliveries(): Observable<DeliveryOrder[]> {
    return this.deliveryService.fetchDeliveryOrders().pipe(
      tap((orders) => this.deliveriesSubject.next(orders))
    );
  }

  /**
   * Publica inmediatamente un snapshot optimista de mesas.
   */
  broadcastTables(tables: RestaurantTable[]): void {
    this.tablesSubject.next([...tables]);
  }

  /**
   * Publica inmediatamente un snapshot optimista de deliveries.
   */
  broadcastDeliveries(deliveries: DeliveryOrder[]): void {
    this.deliveriesSubject.next([...deliveries]);
  }

  /**
   * Notifica un ingrediente en stock bajo para mostrar toast/snackbar.
   */
  notifyLowStock(ingredient: Ingredient): void {
    this.lowStockSubject.next(ingredient);
  }
}
