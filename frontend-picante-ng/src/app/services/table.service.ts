import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RestaurantTable {
  id: number;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'READY_TO_KITCHEN' | 'WAITING_KITCHEN' | 'PREPARING' | 'READY' | 'SERVING' | 'WAITING_PAYMENT';
  occupiedAt?: string;
  preparationAt?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface RestaurantOrder {
  id: number;
  tableId: number;
  tableName: string;
  status: 'OPEN' | 'WAITING_PAYMENT' | 'PAID';
  totalAmount: number;
  createdAt: string;
  paidAt?: string;
  items: OrderItem[];
}

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private apiUrl = 'http://localhost:8080/api/tables';

  constructor(private http: HttpClient) { }

  getAllTables(): Observable<RestaurantTable[]> {
    return this.http.get<RestaurantTable[]>(this.apiUrl);
  }

  occupyTable(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/occupy`, {}, { responseType: 'text' });
  }

  confirmTable(id: number, items: { productId: number, quantity: number }[]): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/confirm`, items, { responseType: 'text' });
  }

  sendToKitchen(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/send-to-kitchen`, {}, { responseType: 'text' });
  }

  startPreparation(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/start-preparation`, {}, { responseType: 'text' });
  }

  setReady(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/ready`, {}, { responseType: 'text' });
  }

  serveTable(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/serve`, {}, { responseType: 'text' });
  }

  requestBill(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/request-bill`, {}, { responseType: 'text' });
  }

  payTable(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/pay`, {}, { responseType: 'text' });
  }

  getOrderDetails(id: number): Observable<RestaurantOrder> {
    return this.http.get<RestaurantOrder>(`${this.apiUrl}/${id}/order-details`);
  }

  freeTable(id: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/${id}/free`, {}, { responseType: 'text' });
  }
}
