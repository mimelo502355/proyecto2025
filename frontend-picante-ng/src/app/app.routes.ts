import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';

// Componentes y Guardias EXISTENTES
import { SuperAdmin } from './components/super-admin/super-admin'; 
import { superAdminGuard } from './guards/super-admin-guard'; // Mantenemos el guard de Super Admin si es específico

// Importamos los dashboards que vamos a proteger
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard'; 
import { CocinaDashboardComponent } from './components/cocina-dashboard/cocina-dashboard';
import { MozoDashboardComponent } from './components/mozo-dashboard/mozo-dashboard';

// Importamos el guardia genérico
import { roleGuard } from './guards/role-guard';


export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    
    // --- DASHBOARD PRINCIPAL DE GESTIÓN (ADMIN/CAJERO y SUPER ADMIN) ---
    { 
        path: 'admin-panel', 
        component: SuperAdmin, // Usas el componente SuperAdmin para esta ruta
        canActivate: [roleGuard], // Usamos el guardia genérico
        data: { rolesEsperados: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'] } 
    },

    // --- DASHBOARD DE MOZO (MESAS) ---
    { 
        path: 'mesas', 
        component: MozoDashboardComponent, // Asumo que este componente tiene el mapa de mesas
        canActivate: [roleGuard],
        data: { rolesEsperados: ['ROLE_MOZO'] } 
    },
    
    // --- DASHBOARD DE COCINA ---
    { 
        path: 'cocina', 
        component: CocinaDashboardComponent, 
        canActivate: [roleGuard],
        data: { rolesEsperados: ['ROLE_COCINA'] } 
    },

    { path: '', redirectTo: 'login', pathMatch: 'full' }
];