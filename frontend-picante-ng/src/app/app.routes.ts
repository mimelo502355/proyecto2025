import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; // Tus imports originales
import { HomeComponent } from './components/home/home';

// 1. IMPORTAMOS LO NUEVO (Generado por CLI)
// Angular CLI crea el archivo como 'super-admin.component.ts'
import { SuperAdmin } from './components/super-admin/super-admin';
// El guard se crea como 'super-admin.guard.ts'
import { superAdminGuard } from './guards/super-admin-guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    
    // 2. AGREGAMOS LA RUTA PROTEGIDA
    { 
        path: 'admin-panel',          // La URL será localhost:4200/admin-panel
        component: SuperAdmin, 
        canActivate: [superAdminGuard] // ¡Aquí está el portero de seguridad!
    },

    { path: '', redirectTo: 'login', pathMatch: 'full' }
];