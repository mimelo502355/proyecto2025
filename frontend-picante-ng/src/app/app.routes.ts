import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';
import { MeseroDashboardComponent } from './components/mesero-dashboard/mesero-dashboard.component';
import { ChefDashboardComponent } from './components/chef-dashboard/chef-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'mesero-dashboard', component: MeseroDashboardComponent },
    { path: 'chef', component: ChefDashboardComponent },
    { path: 'admin', component: AdminDashboardComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];