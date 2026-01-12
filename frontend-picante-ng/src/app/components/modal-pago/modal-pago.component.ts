/**
 * Modal de Pago Reutilizable
 * Componente compartido para procesar pagos en mesas
 * 
 * @autor Equipo El Picante
 * @version 1.0.0
 */
import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantTable, TableService } from '../../services/table.service';
import { ValidadoresServicio } from '../../services/validadores.servicio';
import { FormateadoresServicio } from '../../services/formateadores.servicio';

export interface DatosPago {
  mesaId: number;
  metodoPago: 'EFECTIVO' | 'YAPE' | 'TARJETA' | 'OTRO';
  montoRecibido: number;
  tipoDocumento: 'BOLETA' | 'FACTURA';
  numeroDocumento: string;
  documentoCliente: string;
  nombreCliente: string;
  vuelto: number;
}

export interface ResultadoPago {
  exito: boolean;
  mensaje: string;
  datos?: DatosPago;
}

@Component({
  selector: 'app-modal-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Overlay -->
    <div class="modal-overlay" *ngIf="abierto" (click)="cerrar()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <h3>💰 Procesar Pago - {{ mesa?.name }}</h3>
          <button class="btn-cerrar" (click)="cerrar()" title="Cerrar">&times;</button>
        </div>

        <!-- Body -->
        <div class="modal-body" *ngIf="pedido">
          
          <!-- Resumen del Pedido -->
          <div class="seccion-pedido">
            <h4>Resumen del Pedido</h4>
            <div class="items-pedido">
              <div class="item-linea" *ngFor="let item of pedido.items">
                <span class="item-nombre">{{ item.quantity }}x {{ item.name }}</span>
                <span class="item-precio">{{ formateadores.formatearMoneda(item.subtotal) }}</span>
              </div>
            </div>
            <hr>
            <div class="total-linea">
              <strong>TOTAL:</strong>
              <strong class="total-valor">{{ formateadores.formatearMoneda(pedido.totalAmount) }}</strong>
            </div>
          </div>

          <!-- Método de Pago -->
          <div class="seccion-metodo">
            <h4>Método de Pago</h4>
            <div class="metodos-grid">
              <button 
                *ngFor="let metodo of metodosPago"
                [class.activo]="metodoPago === metodo.valor"
                (click)="seleccionarMetodo(metodo.valor)"
                class="btn-metodo">
                <span class="metodo-icono">{{ metodo.icono }}</span>
                <span class="metodo-nombre">{{ metodo.nombre }}</span>
              </button>
            </div>
          </div>

          <!-- Monto Recibido (solo efectivo) -->
          <div class="seccion-monto" *ngIf="metodoPago === 'EFECTIVO'">
            <h4>Monto Recibido</h4>
            <div class="input-grupo">
              <span class="input-prefijo">S/.</span>
              <input 
                type="number" 
                [(ngModel)]="montoRecibido" 
                class="input-monto"
                min="0"
                step="0.10"
                placeholder="0.00">
            </div>
            <div class="vuelto" *ngIf="vueltoCalculado > 0">
              <span class="vuelto-label">Vuelto:</span>
              <span class="vuelto-valor">{{ formateadores.formatearMoneda(vueltoCalculado) }}</span>
            </div>
          </div>

          <!-- Tipo de Comprobante -->
          <div class="seccion-documento">
            <h4>Comprobante</h4>
            <div class="tipo-documento-toggle">
              <button 
                [class.activo]="tipoDocumento === 'BOLETA'"
                (click)="cambiarTipoDocumento('BOLETA')"
                class="btn-tipo">
                📋 Boleta
              </button>
              <button 
                [class.activo]="tipoDocumento === 'FACTURA'"
                (click)="cambiarTipoDocumento('FACTURA')"
                class="btn-tipo">
                📄 Factura
              </button>
            </div>

            <div class="numero-documento">
              <label>Nº Comprobante:</label>
              <input type="text" [value]="numeroDocumento" readonly class="input-readonly">
            </div>

            <!-- Datos del Cliente -->
            <div class="datos-cliente" *ngIf="tipoDocumento === 'BOLETA'">
              <div class="input-grupo-vertical">
                <label>DNI (opcional):</label>
                <input 
                  type="text" 
                  [(ngModel)]="documentoCliente" 
                  maxlength="8"
                  placeholder="12345678"
                  class="input-documento">
              </div>
            </div>

            <div class="datos-cliente" *ngIf="tipoDocumento === 'FACTURA'">
              <div class="input-grupo-vertical">
                <label>RUC:</label>
                <div class="input-con-boton">
                  <input 
                    type="text" 
                    [(ngModel)]="documentoCliente" 
                    maxlength="11"
                    placeholder="20123456789"
                    class="input-documento">
                  <button 
                    type="button" 
                    (click)="buscarRUC()" 
                    class="btn-buscar"
                    [disabled]="documentoCliente.length !== 11">
                    🔍
                  </button>
                </div>
              </div>
              <div class="input-grupo-vertical">
                <label>Razón Social:</label>
                <input 
                  type="text" 
                  [(ngModel)]="nombreCliente" 
                  placeholder="Empresa S.A.C."
                  class="input-razon-social">
              </div>
            </div>
          </div>

          <!-- Error -->
          <div class="error-mensaje" *ngIf="error">
            ⚠️ {{ error }}
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-cancelar" (click)="cerrar()">
            Cancelar
          </button>
          <button 
            class="btn-imprimir" 
            (click)="imprimir()"
            title="Imprimir comprobante">
            🖨️ Imprimir
          </button>
          <button 
            class="btn-confirmar" 
            (click)="confirmarPago()"
            [disabled]="procesando">
            {{ procesando ? 'Procesando...' : '✓ Confirmar Pago' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 95%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      color: white;
      border-radius: 12px 12px 0 0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .btn-cerrar {
      background: none;
      border: none;
      color: white;
      font-size: 1.8rem;
      cursor: pointer;
      padding: 0 8px;
      line-height: 1;
    }

    .btn-cerrar:hover {
      opacity: 0.8;
    }

    .modal-body {
      padding: 20px;
    }

    .seccion-pedido,
    .seccion-metodo,
    .seccion-monto,
    .seccion-documento {
      margin-bottom: 20px;
    }

    .seccion-pedido h4,
    .seccion-metodo h4,
    .seccion-monto h4,
    .seccion-documento h4 {
      margin: 0 0 12px 0;
      font-size: 0.95rem;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 6px;
    }

    .items-pedido {
      max-height: 150px;
      overflow-y: auto;
    }

    .item-linea {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.9rem;
    }

    .total-linea {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 1.1rem;
    }

    .total-valor {
      color: #27ae60;
    }

    .metodos-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .btn-metodo {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 8px;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-metodo:hover {
      border-color: #3498db;
      background: #f8f9fa;
    }

    .btn-metodo.activo {
      border-color: #3498db;
      background: #e8f4fd;
    }

    .metodo-icono {
      font-size: 1.5rem;
      margin-bottom: 4px;
    }

    .metodo-nombre {
      font-size: 0.75rem;
      text-align: center;
    }

    .input-grupo {
      display: flex;
      align-items: center;
      border: 2px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }

    .input-prefijo {
      padding: 10px 12px;
      background: #f8f9fa;
      font-weight: bold;
      color: #666;
    }

    .input-monto {
      flex: 1;
      border: none;
      padding: 10px;
      font-size: 1.2rem;
      outline: none;
    }

    .vuelto {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding: 10px;
      background: #e8f8f5;
      border-radius: 8px;
    }

    .vuelto-valor {
      font-weight: bold;
      color: #27ae60;
    }

    .tipo-documento-toggle {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .btn-tipo {
      flex: 1;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-tipo:hover {
      border-color: #3498db;
    }

    .btn-tipo.activo {
      border-color: #3498db;
      background: #e8f4fd;
    }

    .numero-documento {
      margin-bottom: 15px;
    }

    .numero-documento label,
    .input-grupo-vertical label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.85rem;
      color: #666;
    }

    .input-readonly {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: #f8f9fa;
      font-family: monospace;
    }

    .input-grupo-vertical {
      margin-bottom: 12px;
    }

    .input-documento,
    .input-razon-social {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .input-documento:focus,
    .input-razon-social:focus {
      border-color: #3498db;
      outline: none;
    }

    .input-con-boton {
      display: flex;
      gap: 8px;
    }

    .input-con-boton .input-documento {
      flex: 1;
    }

    .btn-buscar {
      padding: 8px 16px;
      border: 2px solid #3498db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-buscar:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-mensaje {
      padding: 12px;
      background: #ffeaea;
      border: 1px solid #e74c3c;
      border-radius: 8px;
      color: #c0392b;
      margin-top: 10px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 20px;
      border-top: 1px solid #eee;
      background: #f8f9fa;
      border-radius: 0 0 12px 12px;
    }

    .btn-cancelar,
    .btn-imprimir,
    .btn-confirmar {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancelar {
      background: white;
      border: 2px solid #ddd;
      color: #666;
    }

    .btn-cancelar:hover {
      background: #f8f9fa;
    }

    .btn-imprimir {
      background: white;
      border: 2px solid #3498db;
      color: #3498db;
    }

    .btn-imprimir:hover {
      background: #e8f4fd;
    }

    .btn-confirmar {
      background: #27ae60;
      border: 2px solid #27ae60;
      color: white;
    }

    .btn-confirmar:hover:not(:disabled) {
      background: #219a52;
    }

    .btn-confirmar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 500px) {
      .metodos-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ModalPagoComponent implements OnInit {
  private tableService = inject(TableService);
  public validadores = inject(ValidadoresServicio);
  public formateadores = inject(FormateadoresServicio);

  @Input() abierto = false;
  @Input() mesa: RestaurantTable | null = null;

  @Output() cerrarModal = new EventEmitter<void>();
  @Output() pagoConfirmado = new EventEmitter<ResultadoPago>();

  pedido: any = null;
  metodoPago: 'EFECTIVO' | 'YAPE' | 'TARJETA' | 'OTRO' = 'EFECTIVO';
  montoRecibido: number | null = null;
  tipoDocumento: 'BOLETA' | 'FACTURA' = 'BOLETA';
  numeroDocumento = '';
  documentoCliente = '';
  nombreCliente = '';
  error = '';
  procesando = false;

  metodosPago = [
    { valor: 'EFECTIVO' as const, nombre: 'Efectivo', icono: '💵' },
    { valor: 'YAPE' as const, nombre: 'Yape', icono: '📱' },
    { valor: 'TARJETA' as const, nombre: 'Tarjeta', icono: '💳' },
    { valor: 'OTRO' as const, nombre: 'Otro', icono: '📝' }
  ];

  ngOnInit(): void {
    if (this.mesa) {
      this.cargarPedido();
    }
  }

  ngOnChanges(): void {
    if (this.abierto && this.mesa) {
      this.cargarPedido();
      this.reiniciarFormulario();
    }
  }

  private cargarPedido(): void {
    if (!this.mesa) return;
    
    this.tableService.getOrderDetails(this.mesa.id).subscribe({
      next: (order) => {
        this.pedido = order;
        this.montoRecibido = order?.totalAmount || 0;
      },
      error: (err) => {
        console.error('Error cargando pedido:', err);
        this.error = 'No se pudo cargar el detalle del pedido';
      }
    });
  }

  private reiniciarFormulario(): void {
    this.metodoPago = 'EFECTIVO';
    this.tipoDocumento = 'BOLETA';
    this.numeroDocumento = this.validadores.generarNumeroDocumento('BOLETA');
    this.documentoCliente = '';
    this.nombreCliente = '';
    this.error = '';
    this.procesando = false;
  }

  seleccionarMetodo(metodo: 'EFECTIVO' | 'YAPE' | 'TARJETA' | 'OTRO'): void {
    this.metodoPago = metodo;
  }

  cambiarTipoDocumento(tipo: 'BOLETA' | 'FACTURA'): void {
    this.tipoDocumento = tipo;
    this.numeroDocumento = this.validadores.generarNumeroDocumento(tipo);
    this.documentoCliente = '';
    this.nombreCliente = '';
  }

  get vueltoCalculado(): number {
    if (!this.pedido) return 0;
    return this.validadores.calcularVuelto(
      this.pedido.totalAmount || 0,
      this.montoRecibido || 0
    );
  }

  buscarRUC(): void {
    if (this.documentoCliente.length !== 11) {
      this.error = 'El RUC debe tener 11 dígitos';
      return;
    }

    // Buscar en caché de sesión
    const cacheRaw = sessionStorage.getItem('rucCache');
    const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
    
    if (cache[this.documentoCliente]) {
      this.nombreCliente = cache[this.documentoCliente];
      this.error = '';
      return;
    }

    // Demo: generar razón social ficticia
    this.nombreCliente = `EMPRESA ${this.documentoCliente.slice(-4)} S.A.C.`;
    cache[this.documentoCliente] = this.nombreCliente;
    sessionStorage.setItem('rucCache', JSON.stringify(cache));
    this.error = '';
  }

  confirmarPago(): void {
    if (!this.mesa || !this.pedido) return;

    // Validar formulario
    const validacion = this.validadores.validarFormularioPago({
      metodoPago: this.metodoPago,
      montoRecibido: this.montoRecibido,
      montoTotal: this.pedido.totalAmount || 0,
      comprobante: {
        tipo: this.tipoDocumento,
        numero: this.numeroDocumento,
        documentoId: this.documentoCliente,
        nombre: this.nombreCliente
      }
    });

    if (!validacion.esValido) {
      this.error = validacion.mensaje;
      return;
    }

    this.error = '';
    this.procesando = true;

    // Procesar pago
    this.tableService.payTable(this.mesa.id).subscribe({
      next: () => {
        const resultado: ResultadoPago = {
          exito: true,
          mensaje: `Pago procesado correctamente (${this.metodoPago})`,
          datos: {
            mesaId: this.mesa!.id,
            metodoPago: this.metodoPago,
            montoRecibido: this.montoRecibido || 0,
            tipoDocumento: this.tipoDocumento,
            numeroDocumento: this.numeroDocumento,
            documentoCliente: this.documentoCliente,
            nombreCliente: this.nombreCliente,
            vuelto: this.vueltoCalculado
          }
        };
        this.pagoConfirmado.emit(resultado);
        this.procesando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al procesar el pago';
        this.procesando = false;
        this.pagoConfirmado.emit({
          exito: false,
          mensaje: this.error
        });
      }
    });
  }

  imprimir(): void {
    window.print();
  }

  cerrar(): void {
    this.cerrarModal.emit();
  }
}
