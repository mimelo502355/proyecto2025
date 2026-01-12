import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface DeliveryOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface DeliveryOrder {
  id?: number;
  customerName: string;
  phone: string;
  address: string;
  reference: string;
  notes: string;
  items?: DeliveryOrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt?: Date;
  readyAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private apiUrl = 'http://localhost:8080/api/delivery';
  private http = inject(HttpClient);

  private deliveryOrdersSubject = new BehaviorSubject<DeliveryOrder[]>([]);
  public deliveryOrders$ = this.deliveryOrdersSubject.asObservable();

  private nextId = 1000;

  createDeliveryOrder(order: DeliveryOrder): Observable<DeliveryOrder> {
    // Intentar enviar al backend. Si falla, usar mock local
    return new Observable(observer => {
      this.http.post<DeliveryOrder>(`${this.apiUrl}/create`, order).subscribe({
        next: (newOrder) => {
          const currentOrders = this.deliveryOrdersSubject.value;
          this.deliveryOrdersSubject.next([...currentOrders, newOrder]);
          observer.next(newOrder);
          observer.complete();
        },
        error: () => {
          // Fallback: crear localmente
          const newOrder: DeliveryOrder = {
            ...order,
            id: this.nextId++,
            status: 'pending',
            createdAt: new Date(),
            totalAmount: (order.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)
          };
          const currentOrders = this.deliveryOrdersSubject.value;
          this.deliveryOrdersSubject.next([...currentOrders, newOrder]);
          observer.next(newOrder);
          observer.complete();
        }
      });
    });
  }

  // Enviar pedido a cocina (como lo hace el mozo)
  sendDeliveryToKitchen(orderId: number, items: { productId: number, quantity: number }[]): Observable<string> {
    const request = { items };
    return this.http.post(`${this.apiUrl}/${orderId}/send-to-kitchen`, request, { responseType: 'text' });
  }

  // Sincronizar todos los pedidos desde backend
  fetchDeliveryOrders(): Observable<DeliveryOrder[]> {
    return this.http.get<DeliveryOrder[]>(`${this.apiUrl}`).pipe(
      tap(orders => this.deliveryOrdersSubject.next(orders))
    );
  }

  getDeliveryOrders(): Observable<DeliveryOrder[]> {
    return this.deliveryOrders$;
  }

  // Actualizar estado del delivery en backend y reflejarlo localmente
  updateDeliveryStatus(orderId: number, newStatus: string): Observable<DeliveryOrder> {
    const statusParam = newStatus.toUpperCase();
    return this.http.put<DeliveryOrder>(`${this.apiUrl}/${orderId}/status?status=${statusParam}`, {}).pipe(
      tap((updated) => {
        const orders = this.deliveryOrdersSubject.value;
        const idx = orders.findIndex(o => o.id === updated.id);
        if (idx !== -1) {
          orders[idx] = { ...orders[idx], ...updated } as DeliveryOrder;
          this.deliveryOrdersSubject.next([...orders]);
        }
      })
    );
  }

  updateDeliveryOrderStatus(orderId: number, newStatus: DeliveryOrder['status']): void {
    const orders = this.deliveryOrdersSubject.value;
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      if (newStatus === 'ready') order.readyAt = new Date();
      if (newStatus === 'dispatched') order.dispatchedAt = new Date();
      this.deliveryOrdersSubject.next([...orders]);
    }
  }

  openWhatsApp(phone: string = '+51987935344', restaurantName: string = 'Restaurante Picante'): void {
    const message = `Hola, solicitamos un motorizado para el restaurante ${restaurantName}, por favor confirmar.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  generateDeliveryTicket(order: DeliveryOrder): string {
    const items = order.items || [];
    
    // Calcular precio por item si no está disponible
    const totalItemsQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const pricePerUnit = totalItemsQty > 0 ? (order.totalAmount || 0) / totalItemsQty : 0;
    
    const itemsRows = items.map(item => {
      const unitPrice = item.price && item.price > 0 ? item.price : pricePerUnit;
      const subtotal = item.quantity * unitPrice;
      
      return `
        <div class="item-row">
          <div class="item-name">${item.productName}</div>
          <div class="item-details">
            <span>${item.quantity} x S/. ${unitPrice.toFixed(2)}</span>
            <span class="subtotal">S/. ${subtotal.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .header p {
            font-size: 10px;
            margin: 2px 0;
          }
          .order-info {
            border-bottom: 1px dashed #000;
            padding: 8px 0;
            margin-bottom: 8px;
            font-size: 11px;
          }
          .order-info div {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .order-info strong {
            font-weight: bold;
          }
          .customer-section {
            border-bottom: 2px solid #000;
            padding: 8px 0;
            margin-bottom: 8px;
          }
          .customer-section h3 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .customer-section div {
            font-size: 11px;
            margin: 2px 0;
          }
          .items-section {
            border-bottom: 2px solid #000;
            padding: 8px 0;
            margin-bottom: 8px;
          }
          .items-section h3 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .item-row {
            margin-bottom: 6px;
          }
          .item-name {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 2px;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding-left: 4px;
          }
          .subtotal {
            font-weight: bold;
          }
          .total-section {
            padding: 8px 0;
            border-bottom: 2px dashed #000;
            margin-bottom: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: bold;
            padding: 4px 0;
          }
          .notes {
            border-bottom: 1px dashed #000;
            padding: 8px 0;
            margin-bottom: 8px;
            font-size: 10px;
            font-style: italic;
          }
          .notes strong {
            display: block;
            margin-bottom: 2px;
          }
          .footer {
            text-align: center;
            padding: 8px 0;
            font-size: 10px;
          }
          .footer p {
            margin: 2px 0;
          }
          .no-print {
            text-align: center;
            padding: 20px;
            background: #f0f0f0;
            margin-top: 10px;
          }
          .no-print button {
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
            font-family: Arial, sans-serif;
          }
          .no-print button:hover {
            background: #c82333;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>EL PICANTE</h1>
          <p>RUC: 20123456789</p>
          <p>Calle Los Olivos 123 - Lima</p>
          <p>Tel: (01) 234-5678</p>
        </div>

        <div class="order-info">
          <div>
            <span>ORDEN #${order.id || 'N/A'}</span>
            <span>${new Date(order.createdAt || new Date()).toLocaleString('es-PE', { 
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit', 
              minute: '2-digit'
            })}</span>
          </div>
          <div style="margin-top: 4px;">
            <strong>DELIVERY</strong>
          </div>
        </div>

        <div class="customer-section">
          <h3>CLIENTE</h3>
          <div><strong>Nombre:</strong> ${order.customerName}</div>
          <div><strong>Tel:</strong> ${order.phone}</div>
          <div><strong>Direcc:</strong> ${order.address}</div>
          ${order.reference ? `<div><strong>Ref:</strong> ${order.reference}</div>` : ''}
        </div>

        <div class="items-section">
          <h3>PEDIDO</h3>
          ${items.length > 0 ? itemsRows : '<div style="text-align: center; padding: 10px;">Sin items</div>'}
        </div>

        <div class="total-section">
          <div class="total-row">
            <span>TOTAL:</span>
            <span>S/. ${(order.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        ${order.notes ? `
        <div class="notes">
          <strong>NOTAS:</strong>
          ${order.notes}
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>¡Gracias por su preferencia!</strong></p>
          <p>Delivery: 30-45 minutos</p>
        </div>

        <div class="no-print">
          <button onclick="window.print()">🖨️ IMPRIMIR</button>
        </div>
      </body>
      </html>
    `;
  }

  getToken(): string {
    const user = sessionStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.accessToken || '';
    }
    return '';
  }
}
