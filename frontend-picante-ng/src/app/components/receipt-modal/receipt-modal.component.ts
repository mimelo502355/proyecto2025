import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantTable, RestaurantOrder } from '../../services/table.service';
import { PaymentData } from '../payment-modal/payment-modal.component';

@Component({
    selector: 'app-receipt-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './receipt-modal.component.html',
    styleUrls: ['./receipt-modal.component.css']
})
export class ReceiptModalComponent implements OnInit {
    @Input() isOpen: boolean = false;
    @Input() table: RestaurantTable | null = null;
    @Input() order: RestaurantOrder | null = null;
    @Input() paymentData: PaymentData | null = null;
    @Input() mozoTime: number = 0;
    @Input() kitchenTime: number = 0;

    @Output() close = new EventEmitter<void>();
    @Output() print = new EventEmitter<void>();

    currentDateTime: Date = new Date();

    ngOnInit(): void {
        this.currentDateTime = new Date();
    }

    get customerName(): string {
        if (this.paymentData?.customerName) {
            return this.paymentData.customerName;
        }
        return 'Consumidor Final';
    }

    get documentType(): string {
        switch (this.paymentData?.voucherType) {
            case 'BOLETA':
                return 'BOLETA DE VENTA';
            case 'FACTURA':
                return 'FACTURA';
            case 'NOTA_PEDIDO':
            default:
                return 'NOTA DE PEDIDO';
        }
    }

    get documentNumber(): string {
        switch (this.paymentData?.voucherType) {
            case 'BOLETA':
                return this.paymentData?.dni || 'N/A';
            case 'FACTURA':
                return this.paymentData?.ruc || 'N/A';
            default:
                return 'N/A';
        }
    }

    onClose(): void {
        this.close.emit();
    }

    onPrint(): void {
        this.print.emit();
        window.print();
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    get mozoTimeFormatted(): string {
        return this.formatTime(this.mozoTime);
    }

    get kitchenTimeFormatted(): string {
        return this.formatTime(this.kitchenTime);
    }
}
