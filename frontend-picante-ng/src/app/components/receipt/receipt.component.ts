import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantTable, RestaurantOrder } from '../../services/table.service';
import { PaymentData } from '../payment-modal/payment-modal.component';

@Component({
    selector: 'app-receipt',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './receipt.component.html',
    styleUrls: ['./receipt.component.css']
})
export class ReceiptComponent {
    @Input() isOpen: boolean = false;
    @Input() table: RestaurantTable | null = null;
    @Input() order: RestaurantOrder | null = null;
    @Input() paymentData: PaymentData | null = null;
    
    @Output() close = new EventEmitter<void>();
    @Output() print = new EventEmitter<void>();

    get receiptNumber(): string {
        // Generar número de recibo basado en timestamp y ID
        return `RCP-${this.table?.id}-${new Date().getTime().toString().slice(-6)}`;
    }

    get voucherTypeLabel(): string {
        const type = this.paymentData?.voucherType;
        const labels: { [key: string]: string } = {
            'NOTA_PEDIDO': 'Nota de Pedido',
            'BOLETA': 'Boleta',
            'FACTURA': 'Factura'
        };
        return labels[type || 'NOTA_PEDIDO'];
    }

    get paymentMethodLabel(): string {
        const method = this.paymentData?.paymentMethod;
        const labels: { [key: string]: string } = {
            'YAPE': '🔵 YAPE',
            'EFECTIVO': '💵 EFECTIVO',
            'TARJETA': '💳 TARJETA',
            'OTRO': 'OTRO'
        };
        return labels[method || 'EFECTIVO'];
    }

    onClose(): void {
        this.close.emit();
    }

    onPrint(): void {
        this.print.emit();
    }

    get formattedDate(): string {
        return new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    get formattedTime(): string {
        return new Date().toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    get change(): number {
        if (!this.paymentData?.amountReceived || !this.order) return 0;
        return this.paymentData.amountReceived - this.order.totalAmount;
    }
}
