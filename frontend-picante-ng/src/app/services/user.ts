import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  roles?: any[];
  accountNonLocked?: boolean;
  verificationCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/management/users';
  private http = inject(HttpClient);

  // Obtener todos los usuarios (solo admin)
  getAllUsers(): Observable<User[]> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<User[]>(this.apiUrl, { headers });
  }

  // Crear usuario (solo admin)
  createUser(user: User): Observable<User> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<User>(this.apiUrl, user, { headers });
  }

  // Actualizar usuario (solo admin)
  updateUser(id: number, user: User): Observable<User> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.put<User>(`${this.apiUrl}/${id}`, user, { headers });
  }

  // Eliminar usuario (solo admin)
  deleteUser(id: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }

  // Bloquear/Desbloquear usuario (solo admin)
  toggleLock(id: number, lock: boolean): Observable<User> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put<User>(`${this.apiUrl}/${id}/lock?lock=${lock}`, {}, { headers });
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
}
