/**
 * Componente: Botón Actualizar
 * Botón reutilizable para refrescar datos manualmente
 * 
 * @autor Equipo El Picante
 */
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boton-actualizar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      (click)="alHacerClick()"
      [disabled]="cargando"
      class="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-2 shadow-sm"
      [class.btn-spinning]="cargando"
      [title]="textoTooltip">
      <i class="bi" [class.bi-arrow-clockwise]="!cargando" [class.bi-hourglass-split]="cargando" 
         [class.spin-animation]="cargando"></i>
      <span class="d-none d-md-inline">{{ cargando ? 'Actualizando...' : texto }}</span>
    </button>
  `,
  styles: [`
    .spin-animation {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .btn-spinning {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    button {
      transition: all 0.2s ease;
    }
    
    button:hover:not(:disabled) {
      transform: scale(1.05);
    }
  `]
})
export class BotonActualizarComponent {
  @Input() texto: string = 'Actualizar';
  @Input() textoTooltip: string = 'Actualizar datos';
  @Input() cargando: boolean = false;
  @Output() actualizar = new EventEmitter<void>();

  alHacerClick(): void {
    if (!this.cargando) {
      this.actualizar.emit();
    }
  }
}
