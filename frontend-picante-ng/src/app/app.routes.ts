import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login'; // Tu login.ts
import { HomeComponent } from './components/home/home';   // <--- AQUÍ ESTÁ EL CAMBIO

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' }
];