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

  /**
   * Login con sessionStorage para aislamiento por pestaña.
   * Cada pestaña mantiene su propia sesión independiente.
   */
  login(credentials: any): Observable<any> {
    return this.http.post(this.apiUrl + 'login', credentials).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          // MIGRADO A sessionStorage: cada pestaña tiene su propia sesión
          sessionStorage.setItem('user', JSON.stringify(response));
          console.log('✓ Sesión almacenada en sessionStorage (aislada por pestaña)');
        }
      })
    );
  }

  /**
   * Logout: limpia SOLO la sesión de esta pestaña.
   * Otras pestañas NO se verán afectadas.
   */
  logout(): void {
    sessionStorage.removeItem('user');
    console.log('✓ Sesión cerrada en esta pestaña (otras pestañas no afectadas)');
  }

  /**
   * Obtiene el usuario desde sessionStorage.
   * Cada pestaña consulta su propia sesión aislada.
   */
  getUser(): any {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Verifica si hay una sesión activa en esta pestaña.
   */
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('user');
  }

  /**
   * Obtiene el token JWT desde sessionStorage.
   */
  getToken(): string | null {
    const user = this.getUser();
    return user?.accessToken || null;
  }

  register(user: any): Observable<any> {
    // Este ya lo tenías bien
    return this.http.post(this.apiUrl + 'signup', user, { responseType: 'text' });
  }

  verify(data: any): Observable<any> {
    // --- AQUÍ ESTABA EL ERROR ---
    // Agregamos { responseType: 'text' } para que Angular acepte la respuesta simple
    return this.http.post(this.apiUrl + 'verify', data, { responseType: 'text' });
  }
}