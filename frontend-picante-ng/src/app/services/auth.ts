import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth/'; 
  private http = inject(HttpClient);

  constructor() { }

  login(credentials: any): Observable<any> {
    return this.http.post(this.apiUrl + 'login', credentials).pipe(
      tap((response: any) => {
        if (response.accessToken) { // Ojo: Asegúrate que tu backend devuelve 'accessToken' o 'token'
          localStorage.setItem('user', JSON.stringify(response));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('user');
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  register(user: any): Observable<any> {
    return this.http.post(this.apiUrl + 'signup', user, { responseType: 'text' });
  }

  verify(data: any): Observable<any> {
    return this.http.post(this.apiUrl + 'verify', data, { responseType: 'text' });
  }

  // --- NUEVOS MÉTODOS PARA EL SUPER ADMIN ---

  // 1. Obtener los roles del usuario guardado
  getRoles(): string[] {
    const user = this.getUser();
    return user && user.roles ? user.roles : [];
  }

  // 2. Preguntar si tiene un rol específico
  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  // 3. Preguntar si es el SUPER ADMIN (El rol oculto)
  isSuperAdmin(): boolean {
    return this.hasRole('ROLE_SUPER_ADMIN');
  }
}