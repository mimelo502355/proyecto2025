import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

/**
 * AuthInterceptor refactorizado para sessionStorage.
 * 
 * AISLAMIENTO DE SESIÓN POR PESTAÑA:
 * - Cada pestaña tiene su propio sessionStorage independiente
 * - El token JWT se lee desde sessionStorage (no localStorage)
 * - Las solicitudes HTTP solo incluyen el token de LA PESTAÑA ACTUAL
 * 
 * SEGURIDAD:
 * - Previene contaminación cruzada entre pestañas
 * - Si cierras la pestaña, la sesión se pierde (comportamiento esperado)
 * - Otras pestañas NO se ven afectadas por logout en una pestaña
 * 
 * AUTO-REDIRECT 401:
 * - Si el servidor responde 401, limpia sessionStorage y redirige a /login
 * - Esto ocurre cuando la sesión expiró o el token es inválido
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    
    // MIGRADO A sessionStorage: cada pestaña consulta su propia sesión
    const userJson = sessionStorage.getItem('user');
    let token = null;

    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            token = user.accessToken;
        } catch (e) {
            console.error('❌ Error parsing user from sessionStorage', e);
        }
    }

    if (token) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        
        return next(authReq).pipe(
            tap({
                error: (err) => {
                    if (err.status === 401) {
                        console.warn('🔒 Token inválido/expirado. Redirigiendo al login...');
                        sessionStorage.clear(); // Limpia sesión corrupta
                        router.navigate(['/login']);
                    }
                }
            })
        );
    }

    return next(req);
};
