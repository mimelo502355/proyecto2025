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
        if (response.accessToken) {
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
    // Este ya lo tenías bien
    return this.http.post(this.apiUrl + 'signup', user, { responseType: 'text' });
  }

  verify(data: any): Observable<any> {
    // --- AQUÍ ESTABA EL ERROR ---
    // Agregamos { responseType: 'text' } para que Angular acepte la respuesta simple
    return this.http.post(this.apiUrl + 'verify', data, { responseType: 'text' });
  }
}