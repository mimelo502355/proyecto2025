import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  description: string;
  available: boolean;
  category?: Category;
}

export interface CategoryInput {
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/api/products';
  private categoriesUrl = 'http://localhost:8080/api/categories';
  private http = inject(HttpClient);

  // Obtener todos los productos (público)
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  // Método promise para obtener productos
  async getProducts(): Promise<Product[]> {
    try {
      return await this.http.get<Product[]>(this.apiUrl).toPromise() as Product[];
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  // Método promise para obtener categorías
  async getCategories(): Promise<Category[]> {
    try {
      // Nota: El endpoint de categorías puede requerir autenticación
      const token = this.getToken();
      const headers = token ? new HttpHeaders({
        'Authorization': `Bearer ${token}`
      }) : {};
      
      return await this.http.get<Category[]>(this.categoriesUrl, { headers }).toPromise() as Category[];
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      // Si falla, extraer categorías únicas de los productos
      const products = await this.getProducts();
      const uniqueCategories = products
        .filter(p => p.category)
        .map(p => p.category!)
        .filter((cat, index, self) => 
          self.findIndex(c => c.id === cat.id) === index
        );
      return uniqueCategories;
    }
  }

  // Obtener un producto por ID (público)
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // Crear producto (solo admin)
  createProduct(product: Product): Observable<Product> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<Product>(this.apiUrl, product, { headers });
  }

  // Actualizar producto (solo admin)
  updateProduct(id: number, product: Product): Observable<Product> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product, { headers });
  }

  // Eliminar producto (solo admin)
  deleteProduct(id: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.apiUrl}/${id}`, { headers, responseType: 'text' });
  }

  // Crear categoría (admin)
  createCategory(category: CategoryInput): Observable<Category> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<Category>(this.categoriesUrl, category, { headers });
  }

  // Actualizar categoría (admin)
  updateCategory(id: number, category: CategoryInput): Observable<Category> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<Category>(`${this.categoriesUrl}/${id}`, category, { headers });
  }

  // Eliminar categoría (admin)
  deleteCategory(id: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(`${this.categoriesUrl}/${id}`, { headers, responseType: 'text' });
  }

  // Helper para obtener el token del sessionStorage (aislamiento por pestaña)
  private getToken(): string {
    const user = sessionStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.accessToken || '';
    }
    return '';
  }

  // Invalidar caché de productos
  invalidateCache(): void {
    // Los datos se obtienen directamente del servidor en cada llamada,
    // pero aquí puedes agregar lógica adicional si usas un caché local
    console.log('Caché de productos invalidado');
  }
}
