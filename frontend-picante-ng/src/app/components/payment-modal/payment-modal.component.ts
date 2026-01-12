import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantTable, RestaurantOrder } from '../../services/table.service';
import { DocumentService } from '../../services/document.service';

export interface PaymentData {
    voucherType: 'NOTA_PEDIDO' | 'BOLETA' | 'FACTURA';
    paymentMethod: 'YAPE' | 'EFECTIVO' | 'TARJETA' | 'OTRO';
    dni?: string;
    ruc?: string;
    customerName?: string;
    amountReceived?: number;
}

@Component({
    selector: 'app-payment-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './payment-modal.component.html',
    styleUrls: ['./payment-modal.component.css']
})
export class PaymentModalComponent implements OnInit, OnChanges {
    @Input() isOpen: boolean = false;
    @Input() table: RestaurantTable | null = null;
    @Input() order: RestaurantOrder | null = null;
    @Input() mozoTime: number = 0; // tiempo en segundos
    @Input() kitchenTime: number = 0; // tiempo en segundos
    
    @Output() close = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<PaymentData>();

    private documentService = inject(DocumentService);

    paymentData: PaymentData = {
        voucherType: 'NOTA_PEDIDO',
        paymentMethod: 'EFECTIVO',
        dni: '',
        ruc: '',
        customerName: '',
        amountReceived: undefined
    };

    // Estados de carga
    loadingRUC: boolean = false;
    loadingDNI: boolean = false;
    rucError: string = '';
    dniError: string = '';
    rucData: any = null;
    dniData: any = null;

    voucherTypes = [
        { value: 'NOTA_PEDIDO', label: 'Nota de Pedido' },
        { value: 'BOLETA', label: 'Boleta' },
        { value: 'FACTURA', label: 'Factura' }
    ];

    paymentMethods = [
        { value: 'YAPE', label: 'Yape' },
        { value: 'EFECTIVO', label: 'Efectivo' },
        { value: 'TARJETA', label: 'Tarjeta' },
        { value: 'OTRO', label: 'Otro' }
    ];

    ngOnInit(): void {
        if (!this.order) return;
        this.paymentData.amountReceived = this.order.totalAmount;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['order']?.currentValue) {
            const ord = changes['order'].currentValue as RestaurantOrder;
            this.paymentData.amountReceived = ord.totalAmount;
        }
    }

    get showDniField(): boolean {
        return this.paymentData.voucherType === 'BOLETA';
    }

    get showRucField(): boolean {
        return this.paymentData.voucherType === 'FACTURA';
    }

    get mozoTimeFormatted(): string {
        return this.formatTime(this.mozoTime);
    }

    get kitchenTimeFormatted(): string {
        return this.formatTime(this.kitchenTime);
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    onConfirm(): void {
        if (this.isValidForm()) {
            // Auto-completar nombre si viene del DNI/RUC
            if (!this.paymentData.customerName && this.dniData) {
                // Construir nombre completo del DNI
                const nombres = this.dniData.nombres || '';
                const apellidoP = this.dniData.apellidoPaterno || '';
                const apellidoM = this.dniData.apellidoMaterno || '';
                this.paymentData.customerName = `${apellidoP} ${apellidoM} ${nombres}`.trim();
            }
            this.confirm.emit(this.paymentData);
        }
    }

    onClose(): void {
        this.close.emit();
    }

    private isValidForm(): boolean {
        if (this.paymentData.voucherType === 'BOLETA' && !this.paymentData.dni) {
            alert('DNI requerido para boleta');
            return false;
        }
        if (this.paymentData.voucherType === 'FACTURA' && !this.paymentData.ruc) {
            alert('RUC requerido para factura');
            return false;
        }
        return true;
    }

    consultarRUC(): void {
        if (!this.paymentData.ruc) {
            this.rucError = 'Ingrese un RUC válido';
            return;
        }

        if (!this.documentService.isValidRUC(this.paymentData.ruc)) {
            this.rucError = 'RUC debe tener 11 dígitos';
            return;
        }

        this.loadingRUC = true;
        this.rucError = '';

        this.documentService.consultarRUC(this.paymentData.ruc).subscribe({
            next: (data) => {
                this.rucData = data;
                // Auto-completar nombre si viene en la respuesta
                if (data.razonSocial) {
                    this.paymentData.customerName = data.razonSocial;
                } else if (data.nombre) {
                    this.paymentData.customerName = data.nombre;
                }
                this.loadingRUC = false;
            },
            error: (err) => {
                this.rucError = 'RUC no encontrado o inválido';
                this.rucData = null;
                this.loadingRUC = false;
                console.error('Error consultando RUC:', err);
            }
        });
    }

    consultarDNI(): void {
        if (!this.paymentData.dni) {
            this.dniError = 'Ingrese un DNI válido';
            return;
        }

        if (!this.documentService.isValidDNI(this.paymentData.dni)) {
            this.dniError = 'DNI debe tener 8 dígitos';
            return;
        }

        this.loadingDNI = true;
        this.dniError = '';

        this.documentService.consultarDNI(this.paymentData.dni).subscribe({
            next: (data) => {
                this.dniData = data;
                // Auto-completar nombre con formato completo
                if (data.nombres) {
                    const nombres = data.nombres || '';
                    const apellidoP = data.apellidoPaterno || '';
                    const apellidoM = data.apellidoMaterno || '';
                    this.paymentData.customerName = `${apellidoP} ${apellidoM} ${nombres}`.trim();
                }
                this.loadingDNI = false;
            },
            error: (err) => {
                this.dniError = 'DNI no encontrado o inválido';
                this.dniData = null;
                this.loadingDNI = false;
                console.error('Error consultando DNI:', err);
            }
        });
    }

    get change(): number {
        if (!this.paymentData.amountReceived || !this.order) return 0;
        return this.paymentData.amountReceived - this.order.totalAmount;
    }
}
