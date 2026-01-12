import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeliveryService, DeliveryOrder } from './delivery.service';
import { QueryClient, QueryConfig } from './query-client';

/**
 * Hook para pedidos de delivery (con SWR y background polling).
 */
@Injectable({ providedIn: 'root' })
export class UseDeliveryQuery {
  private deliveryService = inject(DeliveryService);
  private queryClient = inject(QueryClient);

  /**
   * Obtener todos los pedidos de delivery con caché + SWR + polling.
   * Configuración: refetch cada 12 segundos (más frecuente que mesas, delivery es crítico),
   * refetch on focus, SWR habilitado.
   */
  useAllDeliveries(config: Partial<QueryConfig> = {}) {
    const finalConfig = {
      refetchInterval: 12 * 1000, // 12 segundos (más frecuente)
      refetchOnWindowFocus: true,
      staleTime: 8 * 1000, // 8 segundos
      ...config,
    };

    return this.queryClient.useQuery(
      'all-deliveries',
      () =>
        this.deliveryService
          .fetchDeliveryOrders()
          .toPromise() as Promise<DeliveryOrder[]>,
      finalConfig
    ).pipe(
      map((state) => ({
        ...state,
        deliveries: state.data || [],
      }))
    );
  }

  /**
   * Filtrar deliveries por estado.
   */
  useDeliveriesByStatus(status: string, config: Partial<QueryConfig> = {}) {
    return this.useAllDeliveries(config).pipe(
      map((state) => ({
        ...state,
        deliveries: state.deliveries.filter(
          (d) => d.status?.toUpperCase() === status.toUpperCase()
        ),
      }))
    );
  }

  /**
   * Invalidar caché de deliveries (llamar después de crear/actualizar delivery).
   */
  invalidateDeliveries(): void {
    this.queryClient.invalidateQueries('all-deliveries');
  }

  /**
   * Actualizar estado de delivery y re-sincronizar caché automáticamente.
   * Esta es una "mutación optimista" + invalidación.
   */
  updateDeliveryStatusMutation(id: number, newStatus: string): Observable<void> {
    // 1. Actualizar la UI instantáneamente (optimistic update)
    const currentDeliveries = (this.queryClient.getCacheData('all-deliveries') || []) as DeliveryOrder[];
    const updatedDeliveries = currentDeliveries.map((d: DeliveryOrder) =>
      d.id === id ? { ...d, status: newStatus } : d
    );
    this.queryClient.setQueryData('all-deliveries', updatedDeliveries);

    // 2. Hacer la llamada al backend
    return new Observable((observer) => {
      this.deliveryService.updateDeliveryStatus(id, newStatus).subscribe({
        next: () => {
          // 3. Invalidar para refetch en background (SWR)
          this.invalidateDeliveries();
          observer.next();
          observer.complete();
        },
        error: (err) => {
          // En error, revertir la actualización optimista
          const oldDeliveries = (this.queryClient.getCacheData('all-deliveries') || []) as DeliveryOrder[];
          const reverted = oldDeliveries.map((d: DeliveryOrder) =>
            d.id === id ? { ...d, status: d.status } : d
          );
          this.queryClient.setQueryData('all-deliveries', reverted);
          observer.error(err);
        },
      });
    });
  }
}
