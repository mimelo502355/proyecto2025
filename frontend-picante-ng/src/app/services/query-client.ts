import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, merge, of, throwError, fromEvent, Observable } from 'rxjs';
import { switchMap, tap, catchError, distinctUntilChanged, startWith, debounceTime } from 'rxjs/operators';

/**
 * Configuración de caché y polling.
 */
export interface QueryConfig {
  staleTime?: number; // ms antes de marcar como "stale" (por defecto 5 min)
  cacheTime?: number; // ms de retención en caché después de desuscribirse (por defecto 10 min)
  refetchOnWindowFocus?: boolean; // refetch si vuelve el foco
  refetchOnReconnect?: boolean; // refetch si vuelve conexión
  refetchInterval?: number | false; // ms entre refetch automáticos (por defecto: false)
  retryCount?: number; // intentos de reintento
  retryDelay?: number; // ms entre reintentos
}

export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  isStale: boolean;
}

/**
 * QueryClient: Implementa Stale-While-Revalidate, Background Polling,
 * y Refetch-On-Focus sin WebSockets. Basado en principios de React Query.
 */
@Injectable({ providedIn: 'root' })
export class QueryClient {
  private cache = new Map<string, CacheEntry<any>>();
  private queries = new Map<string, BehaviorSubject<any>>();
  private invalidationSubject = new Map<string, BehaviorSubject<void>>();

  private defaultConfig: QueryConfig = {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
    retryCount: 2,
    retryDelay: 1000,
  };

  constructor() {
    this.setupWindowFocusListener();
  }

  /**
   * Hook para obtener datos con SWR, polling y refetch-on-focus.
   * Devuelve un observable que emite { data, isLoading, error, isStale }.
   */
  useQuery<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: Partial<QueryConfig> = {}
  ): BehaviorSubject<{ data: T | null; isLoading: boolean; error: any; isStale: boolean }> {
    const finalConfig = { ...this.defaultConfig, ...config };

    // Crear subject de invalidación si no existe
    if (!this.invalidationSubject.has(key)) {
      this.invalidationSubject.set(key, new BehaviorSubject<void>(undefined));
    }

    // Crear subject principal si no existe
    if (!this.queries.has(key)) {
      const subject = new BehaviorSubject<{ data: T | null; isLoading: boolean; error: any; isStale: boolean }>({
        data: null,
        isLoading: true,
        error: null,
        isStale: true,
      });
      this.queries.set(key, subject);
    }

    const subject = this.queries.get(key) as BehaviorSubject<{ data: T | null; isLoading: boolean; error: any; isStale: boolean }>;
    const invalidation$ = this.invalidationSubject.get(key)!;

    // Construir array de observables para triggers
    const triggerObservables: Observable<any>[] = [invalidation$];

    if (finalConfig.refetchOnWindowFocus) {
      triggerObservables.push(this.onWindowFocus$);
    }

    if (finalConfig.refetchInterval) {
      triggerObservables.push(interval(finalConfig.refetchInterval));
    }

    // Merge de todos los triggers con trigger inicial
    const triggers$ = triggerObservables.length > 0 
      ? merge(...triggerObservables).pipe(startWith(undefined as any))
      : of(undefined);

    // Suscribirse a triggers y ejecutar fetch
    triggers$
      .pipe(
        switchMap(() => {
          const now = Date.now();
          const cached = this.cache.get(key);
          const isCached = cached && (now - cached.fetchedAt < finalConfig.staleTime!);

          if (isCached && cached) {
            // Si hay caché reciente, mostrar datos inmediatamente
            subject.next({ 
              data: cached.data, 
              isLoading: false, 
              error: null, 
              isStale: false 
            });
            // Fetch en background para revalidar
            return this.fetchWithRetry(fetchFn, finalConfig);
          } else {
            // No hay caché o está stale
            subject.next({ 
              data: cached?.data || null, 
              isLoading: true, 
              error: null, 
              isStale: true 
            });
            return this.fetchWithRetry(fetchFn, finalConfig);
          }
        }),
        tap((data: T) => {
          this.cache.set(key, { data, fetchedAt: Date.now(), isStale: false });
          subject.next({ 
            data, 
            isLoading: false, 
            error: null, 
            isStale: false 
          });
        }),
        catchError((error: any) => {
          const cached = this.cache.get(key);
          subject.next({
            data: cached?.data || null,
            isLoading: false,
            error,
            isStale: true,
          });
          return of(undefined);
        })
      )
      .subscribe();

    return subject;
  }

  /**
   * Invalidar un query (fuerza refetch en próximo cycle).
   */
  invalidateQueries(key: string): void {
    const invalidation$ = this.invalidationSubject.get(key);
    if (invalidation$) {
      invalidation$.next();
    }
  }

  /**
   * Limpiar caché de una query (útil al desmontar componentes).
   */
  removeQuery(key: string): void {
    this.cache.delete(key);
    this.queries.delete(key);
    this.invalidationSubject.delete(key);
  }

  /**
   * Obtener el estado actual del caché (sin subscribirse).
   */
  getCacheData<T>(key: string): T | undefined {
    return this.cache.get(key)?.data;
  }

  /**
   * Establecer datos en caché manualmente (para mutaciones optimistas).
   */
  setQueryData<T>(key: string, data: T): void {
    this.cache.set(key, { data, fetchedAt: Date.now(), isStale: false });
    const subject = this.queries.get(key);
    if (subject) {
      subject.next({ data, isLoading: false, error: null, isStale: false });
    }
  }

  /**
   * Fetch con reintentos automáticos.
   */
  private fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    config: QueryConfig
  ): Promise<T> {
    let attempt = 0;

    const attemptFetch = (): Promise<T> => {
      return fetchFn().catch((error) => {
        attempt++;
        if (attempt < (config.retryCount || 2)) {
          const delay = (config.retryDelay || 1000) * Math.pow(2, attempt - 1);
          return new Promise<T>((resolve, reject) =>
            setTimeout(() => attemptFetch().then(resolve).catch(reject), delay)
          );
        }
        return Promise.reject(error);
      });
    };

    return attemptFetch();
  }

  /**
   * Observable que emite cada vez que la ventana recupera el foco.
   */
  private onWindowFocus$ = fromEvent(window, 'focus').pipe(
    debounceTime(100) // evitar múltiples emits
  );

  /**
   * Listener para reconexión (cuando vuelve la conexión de red).
   */
  private setupWindowFocusListener(): void {
    window.addEventListener('online', () => {
      console.log('✓ Conexión restaurada, refetcheando queries...');
      // Invalidar todos los queries si se perdió conexión
      this.invalidationSubject.forEach((subject) => subject.next());
    });
  }
}
