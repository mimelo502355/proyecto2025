import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InventoryService, Ingredient } from './inventory.service';
import { QueryClient, QueryConfig } from './query-client';

/**
 * Hook para inventario (con SWR y background polling).
 */
@Injectable({ providedIn: 'root' })
export class UseInventoryQuery {
  private inventoryService = inject(InventoryService);
  private queryClient = inject(QueryClient);

  /**
   * Obtener todos los ingredientes con caché + SWR + polling.
   * Configuración: refetch cada 20 segundos (menos crítico que delivery/mesas),
   * refetch on focus, SWR habilitado.
   */
  useAllIngredients(config: Partial<QueryConfig> = {}) {
    const finalConfig = {
      refetchInterval: 20 * 1000, // 20 segundos
      refetchOnWindowFocus: true,
      staleTime: 15 * 1000, // 15 segundos
      ...config,
    };

    return this.queryClient.useQuery(
      'all-ingredients',
      () => this.inventoryService.getIngredients().toPromise() as Promise<Ingredient[]>,
      finalConfig
    ).pipe(
      map((state) => ({
        ...state,
        ingredients: state.data || [],
      }))
    );
  }

  /**
   * Obtener solo ingredientes con stock bajo.
   */
  useLowStockIngredients(config: Partial<QueryConfig> = {}) {
    return this.useAllIngredients(config).pipe(
      map((state) => ({
        ...state,
        ingredients: state.ingredients.filter(
          (i) => this.inventoryService.isLowStock(i)
        ),
      }))
    );
  }

  /**
   * Invalidar caché de ingredientes (llamar después de actualizar stock).
   */
  invalidateIngredients(): void {
    this.queryClient.invalidateQueries('all-ingredients');
  }

  /**
   * Actualizar stock de ingrediente (mutación optimista).
   */
  updateIngredientStockMutation(
    ingredientId: number,
    newStock: number
  ): Observable<void> {
    // 1. Actualización optimista
    const currentIngredients = (this.queryClient.getCacheData('all-ingredients') || []) as Ingredient[];
    const updatedIngredients = currentIngredients.map((i: Ingredient) =>
      i.id === ingredientId ? { ...i, stock: newStock } : i
    );
    this.queryClient.setQueryData('all-ingredients', updatedIngredients);

    // 2. Hacer la llamada al backend (simulada aquí)
    return new Observable((observer) => {
      // En una aplicación real, esto sería una llamada HTTP:
      // this.http.put(`/api/inventory/${ingredientId}`, { stock: newStock }).subscribe(...)
      
      // Para ahora, asumimos éxito inmediato
      setTimeout(() => {
        this.inventoryService.updateIngredientStock(ingredientId, newStock, 'manual-adjustment', 'Ajuste desde dashboard');
        this.invalidateIngredients();
        observer.next();
        observer.complete();
      }, 500);
    });
  }
}
