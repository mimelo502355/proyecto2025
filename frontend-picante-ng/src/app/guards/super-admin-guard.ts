import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth'; // Asegúrate de importar bien tu servicio

export const superAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usamos el método que creamos en el Paso 1
  if (authService.isSuperAdmin()) {
    return true; // Acceso concedido
  } else {
    alert('⛔ ALTO AHÍ: No tienes permisos de Super Admin.');
    router.navigate(['/home']); // Lo mandamos a casa
    return false;
  }
};