import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TableService, RestaurantTable } from './table.service';
import { QueryClient, QueryConfig } from './query-client';

/**
 * Hook para mesas (con SWR y background polling).
 * Evita el método loadTables() tradicional y proporciona un observable reactivo.
 */
@Injectable({ providedIn: 'root' })
export class UseTablesQuery {
  private tableService = inject(TableService);
  private queryClient = inject(QueryClient);

  /**
   * Obtener todas las mesas con caché + SWR + polling.
   * Configuración: refetch cada 15 segundos, refetch on focus, SWR habilitado.
   */
  useAllTables(config: Partial<QueryConfig> = {}) {
    const finalConfig = {
      refetchInterval: 15 * 1000, // 15 segundos
      refetchOnWindowFocus: true,
      staleTime: 10 * 1000, // 10 segundos antes de marcar stale
      ...config,
    };

    return this.queryClient.useQuery(
      'all-tables',
      () => this.tableService.getAllTables().toPromise() as Promise<RestaurantTable[]>,
      finalConfig
    ).pipe(
      map((state) => ({
        ...state,
        tables: state.data || [],
      }))
    );
  }

  /**
   * Obtener mesas de un salón específico (S1, S2, etc.).
   */
  useTablesByLocation(location: 'S' | 'P', config: Partial<QueryConfig> = {}) {
    return this.useAllTables(config).pipe(
      map((state) => ({
        ...state,
        tables: state.tables.filter((t) => t.name.trim().startsWith(location)),
      }))
    );
  }

  /**
   * Invalidar caché de mesas (llamar después de una mutación como cambiar estado).
   */
  invalidateTables(): void {
    this.queryClient.invalidateQueries('all-tables');
  }
}
