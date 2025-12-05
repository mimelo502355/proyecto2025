import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

// Asegúrate que la ruta a AuthService sea correcta
import { AuthService } from '../services/auth'; 

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Leemos la lista de roles que espera la ruta (rolesEsperados)
  // Usamos el mismo nombre que se definió en app.routes.ts
  const rolesEsperados: string[] = route.data['rolesEsperados'];

  // Si no hay roles definidos, asumimos que no hay restricción
  if (!rolesEsperados || rolesEsperados.length === 0) {
    return true;
  }
  
  // Obtenemos los roles del usuario
  const userRoles: string[] = authService.getRoles();

  // 2. Comprobamos si el usuario tiene AL MENOS UNO de los roles esperados
  const isAuthorized = rolesEsperados.some(expectedRole => 
    userRoles.includes(expectedRole)
  );

  // 3. Comprobamos si el usuario es Super Admin (prioridad absoluta)
  const isSuperAdmin = authService.isSuperAdmin();

  if (isAuthorized || isSuperAdmin) {
    console.log(`✅ ACCESO CONCEDIDO. Roles del usuario: ${userRoles.join(', ')}`);
    return true;
  } else {
    // 4. Redirección y mensaje sin usar alert()
    console.warn(`⛔ ACCESO DENEGADO. Rol(es) requerido(s): ${rolesEsperados.join(', ')}`);
    router.navigate(['/home']);
    return false;
  }
};