import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth'; // Asegúrate que la ruta es correcta
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
  styleUrl: './login.css'      
})
export class LoginComponent {
  // --- VARIABLES DE ESTADO ---
  showHelpModal: boolean = false;
  showRegisterModal: boolean = false;
  showVerifyModal: boolean = false;
  
  // Datos del formulario
  form: any = {
    username: '',
    password: '',
    role: 'mozo' // Valor por defecto IMPORTANTE para el select
  };
  
  // Estado del login
  isLoginFailed = false;
  errorMessage = '';

  // Inyecciones
  private authService = inject(AuthService);
  private router = inject(Router);

// ... dentro de la clase LoginComponent ...

onSubmit(): void {
    const { username, password } = this.form;

    this.authService.login({ username, password }).subscribe({
        next: (data: any) => { 
            this.isLoginFailed = false;

            // ------------------------------------------
            // 🚀 SOLUCIÓN FINAL DE TIMING 
            // ------------------------------------------
            setTimeout(() => {
                const roles = this.authService.getRoles();
                console.log('✅ Roles leídos justo antes de navegar:', roles);

                if (this.authService.isSuperAdmin() || this.authService.hasRole('ROLE_ADMIN')) {
                    // 1. ADMIN Y SUPER ADMIN van a la misma ruta de gestión
                    this.router.navigate(['/admin-panel']); 
                } else if (this.authService.hasRole('ROLE_COCINA')) {
                    // 2. COCINERO va a su monitor
                    this.router.navigate(['/cocina']); 
                } else if (this.authService.hasRole('ROLE_MOZO')) {
                    // 3. MOZO va al mapa de mesas
                    this.router.navigate(['/mesas']); 
                } else {
                    // 4. Fallback si no tiene rol conocido
                    this.router.navigate(['/home']); 
                }
            }, 50); // Damos 50ms para que localStorage escriba

        },
        error: (err: any) => { 
            // ... (lógica de error) ...
        }
    });
}
// ...

  // ==========================================
  // 2. LÓGICA DE REGISTRO (SOLICITUD)
  // ==========================================
  onRegister(): void {
    console.log("📤 Enviando solicitud de registro...", this.form);

    this.authService.register(this.form).subscribe({
      next: (response: any) => {
        // La respuesta es TEXTO del backend ("Solicitud enviada...")
        console.log("✅ Respuesta del servidor:", response);
        
        // Mensaje claro para el usuario
        alert("¡Solicitud enviada con éxito!\n\n📧 El código de verificación ha sido enviado al correo del ADMINISTRADOR.\n\nPor favor, contacta al admin y pídele el código para continuar.");
        
        // Cerramos registro y abrimos verificación
        this.showRegisterModal = false;
        this.showVerifyModal = true; 
      },
      error: (err: any) => {
        // AQUÍ ARREGLAMOS EL "[object Object]"
        console.error("❌ Error en registro:", err);
        
        let mensajeError = "Ocurrió un error desconocido.";

        if (err.error) {
          if (typeof err.error === 'string') {
            mensajeError = err.error; // Si el backend manda texto simple
          } else if (err.error.message) {
            mensajeError = err.error.message; // Si es un JSON con campo message
          } else {
            mensajeError = JSON.stringify(err.error); // Último recurso
          }
        } else if (err.message) {
            mensajeError = err.message;
        }

        alert("⚠️ No se pudo registrar: " + mensajeError);
      }
    });
  }

  // ==========================================
  // 3. LÓGICA DE VERIFICACIÓN (CÓDIGO)
  // ==========================================
  onVerify(code: string): void {
    if (!code || code.trim() === '') {
      alert("Por favor escribe el código.");
      return;
    }

    console.log("🔐 Verificando código para:", this.form.username);

    // Usamos el username del form y el código ingresado como password
    this.authService.verify({ username: this.form.username, password: code }).subscribe({
      next: (data) => {
        alert("✅ ¡Cuenta verificada correctamente!\n\nAhora puedes iniciar sesión con tu contraseña.");
        this.showVerifyModal = false;
        
        // Limpiamos SOLO la contraseña para que el usuario escriba la suya real
        this.form.password = ''; 
      },
      error: (err) => {
        console.error("❌ Error verificación:", err);
        alert("⛔ Código incorrecto. Pídelo nuevamente al Administrador.");
      }
    });
  }

  // ==========================================
  // 4. CONTROL DE MODALES
  // ==========================================
  toggleHelp() { this.showHelpModal = !this.showHelpModal; }
  
  openRegister() { 
    this.showRegisterModal = true; 
    // Reseteamos el form al abrir para que esté limpio (opcional)
    // this.form.username = '';
    // this.form.password = '';
    this.form.role = 'mozo';
  }
  
  closeRegister() { this.showRegisterModal = false; }
}