import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; 
import { ProductService } from '../../services/product';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html', 
  styleUrl: './home.css'       
})
export class HomeComponent implements OnInit {
  currentUser: any;
  categories: any[] = [];
  products: any[] = [];
  selectedCategory: any = null;
  searchText: string = '';
  loading = true;
  error = '';
  
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private router = inject(Router);

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      this.loading = true;
      
      // Cargar productos
      this.products = await this.productService.getProducts();
      
      // Cargar categorías
      this.categories = await this.productService.getCategories();
      
      this.loading = false;
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.error = 'Error al cargar la carta. Por favor, intenta de nuevo.';
      this.loading = false;
    }
  }

  selectCategory(category: any): void {
    this.selectedCategory = category;
  }

  getProductsByCategory(categoryId: number): any[] {
    return this.products.filter(product => 
      product.category && product.category.id === categoryId
    );
  }

  getFilteredCategories(): any[] {
    return this.categories;
  }

  getSearchResults(): any[] {
    if (!this.searchText.trim()) {
      return [];
    }
    return this.products.filter(product =>
      product.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
      product.description.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  isAdmin(): boolean {
    return Array.isArray(this.currentUser?.roles) && this.currentUser.roles.includes('ROLE_ADMIN');
  }

  goAdmin(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
