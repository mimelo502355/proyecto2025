import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="timer-display" [ngClass]="getTimerClass()">
      <i class="bi bi-stopwatch"></i> {{ elapsedTime$ | async }}
    </span>
  `,
  styles: [`
    .timer-display {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(0, 0, 0, 0.05);
      font-weight: bold;
      font-size: 0.875rem;
      /* Estabilidad visual: números con ancho fijo */
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
      letter-spacing: 0.05em;
    }

    .timer-red {
      color: #dc3545;
      animation: blink 1s infinite;
    }

    .timer-orange {
      color: #fd7e14;
    }

    .timer-normal {
      color: #6c757d;
    }

    @keyframes blink {
      50% {
        opacity: 0.6;
      }
    }
  `]
})
export class TimerComponent implements OnInit {
  @Input() startTime!: string | Date;
  @Input() warningMinutes: number = 20; // Amarillo después de 20 min
  @Input() dangerMinutes: number = 30; // Rojo después de 30 min

  elapsedTime$!: Observable<string>;
  private elapsedMinutes: number = 0;

  ngOnInit(): void {
    if (!this.startTime) {
      console.error('⚠️ TimerComponent: startTime es requerido');
      return;
    }

    // Observable reactivo que calcula el tiempo transcurrido cada segundo
    this.elapsedTime$ = timer(0, 1000).pipe(
      map(() => {
        const start = new Date(this.startTime).getTime();
        const now = Date.now();
        const diffMs = now - start;

        if (diffMs < 0) {
          return '00:00';
        }

        // Calcular minutos para el CSS class
        this.elapsedMinutes = Math.floor(diffMs / 60000);

        // Formatear como HH:MM:SS o MM:SS
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);

        if (hours > 0) {
          return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
        } else {
          return `${this.pad(minutes)}:${this.pad(seconds)}`;
        }
      })
    );
  }

  getTimerClass(): string {
    if (this.elapsedMinutes >= this.dangerMinutes) {
      return 'timer-red';
    } else if (this.elapsedMinutes >= this.warningMinutes) {
      return 'timer-orange';
    }
    return 'timer-normal';
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }
}
