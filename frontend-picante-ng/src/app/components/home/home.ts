import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  // IMPORTANTE: Verifica que estos nombres coincidan con tus archivos reales en esa carpeta
  templateUrl: './home.html', 
  styleUrl: './home.css'       
})
export class HomeComponent implements OnInit {
  currentUser: any;
  
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Al cargar, obtenemos el usuario del almacenamiento local
    this.currentUser = this.authService.getUser();

    // Si no hay usuario logueado, lo devolvemos al Login
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
