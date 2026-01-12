# 🔒 Guía de Aislamiento de Sesión por Pestaña

## 📋 Resumen Ejecutivo

**Problema Resuelto:** Contaminación de sesión entre pestañas (Cross-tab Session Pollution)

**Solución Implementada:** Migración de `localStorage` a `sessionStorage` para todas las operaciones de autenticación

**Resultado:** Cada pestaña del navegador mantiene su propia sesión independiente y aislada

---

## 🎯 Arquitectura de Seguridad

### Antes (localStorage - ❌ Inseguro)

```
┌─────────────────────────────────────────┐
│         NAVEGADOR (Chrome/Firefox)      │
├─────────────────────────────────────────┤
│  localStorage (COMPARTIDO)              │
│  ├─ user: {token: "abc...", role: X}   │
│  └─ Última sesión SOBRESCRIBE anterior  │
├─────────────────────────────────────────┤
│  Pestaña 1: Admin    │ Pestaña 2: Mozo  │
│  (lee el mismo token)│ (sobrescribe)    │
└─────────────────────────────────────────┘
         ❌ CONFLICTO DE ROLES
```

### Después (sessionStorage - ✅ Seguro)

```
┌─────────────────────────────────────────┐
│         NAVEGADOR (Chrome/Firefox)      │
├─────────────────────────────────────────┤
│  Pestaña 1: Admin                       │
│  ├─ sessionStorage (AISLADO)            │
│  └─ user: {token: "xyz", role: ADMIN}   │
├─────────────────────────────────────────┤
│  Pestaña 2: Mozo                        │
│  ├─ sessionStorage (AISLADO)            │
│  └─ user: {token: "abc", role: MOZO}    │
└─────────────────────────────────────────┘
         ✅ CERO CONFLICTOS
```

---

## 🔧 Cambios Implementados

### 1. **AuthService** (`auth.ts`)

#### Antes
```typescript
login(credentials: any): Observable<any> {
  return this.http.post(this.apiUrl + 'login', credentials).pipe(
    tap((response: any) => {
      if (response.accessToken) {
        localStorage.setItem('user', JSON.stringify(response)); // ❌
      }
    })
  );
}

getUser(): any {
  const userStr = localStorage.getItem('user'); // ❌
  return userStr ? JSON.parse(userStr) : null;
}

logout(): void {
  localStorage.removeItem('user'); // ❌
}
```

#### Después
```typescript
login(credentials: any): Observable<any> {
  return this.http.post(this.apiUrl + 'login', credentials).pipe(
    tap((response: any) => {
      if (response.accessToken) {
        sessionStorage.setItem('user', JSON.stringify(response)); // ✅
        console.log('✓ Sesión almacenada en sessionStorage (aislada por pestaña)');
      }
    })
  );
}

getUser(): any {
  const userStr = sessionStorage.getItem('user'); // ✅
  return userStr ? JSON.parse(userStr) : null;
}

logout(): void {
  sessionStorage.removeItem('user'); // ✅
  console.log('✓ Sesión cerrada en esta pestaña (otras pestañas no afectadas)');
}

// NUEVOS MÉTODOS AGREGADOS:
isAuthenticated(): boolean {
  return !!sessionStorage.getItem('user');
}

getToken(): string | null {
  const user = this.getUser();
  return user?.accessToken || null;
}
```

---

### 2. **AuthInterceptor** (`auth.interceptor.ts`)

#### Antes
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const userJson = localStorage.getItem('user'); // ❌
    let token = null;

    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            token = user.accessToken;
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
        }
    }

    if (token) {
        const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next(authReq);
    }

    return next(req);
};
```

#### Después
```typescript
/**
 * AuthInterceptor refactorizado para sessionStorage.
 * 
 * AISLAMIENTO DE SESIÓN POR PESTAÑA:
 * - Cada pestaña tiene su propio sessionStorage independiente
 * - El token JWT se lee desde sessionStorage (no localStorage)
 * - Las solicitudes HTTP solo incluyen el token de LA PESTAÑA ACTUAL
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const userJson = sessionStorage.getItem('user'); // ✅
    let token = null;

    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            token = user.accessToken;
        } catch (e) {
            console.error('❌ Error parsing user from sessionStorage', e);
        }
    }

    if (token) {
        const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next(authReq);
    }

    return next(req);
};
```

---

### 3. **Servicios Auxiliares**

También se migraron:
- ✅ `product.ts` → getToken() usa sessionStorage
- ✅ `user.ts` → getToken() usa sessionStorage
- ✅ `mesero-dashboard.component.ts` → logout() usa sessionStorage

---

## 🧪 Casos de Uso y Comportamiento

### Caso 1: Login en Múltiples Pestañas

**Escenario:**
1. Pestaña A: Login como **Admin** (username: admin, password: 123456)
2. Pestaña B: Login como **Mozo** (username: mozo1, password: 123456)

**Resultado Esperado:**
- ✅ Pestaña A: Mantiene sesión de Admin sin verse afectada
- ✅ Pestaña B: Tiene su propia sesión de Mozo independiente
- ✅ Cada pestaña realiza requests con su propio token JWT
- ✅ CERO conflictos 403 Forbidden

---

### Caso 2: Logout en Una Pestaña

**Escenario:**
1. Pestaña A: Admin logueado
2. Pestaña B: Mozo logueado
3. En Pestaña A: Click en "Cerrar Sesión"

**Resultado Esperado:**
- ✅ Pestaña A: Sesión cerrada, redirige a /login
- ✅ Pestaña B: **NO se ve afectada**, Mozo sigue logueado
- ✅ sessionStorage es independiente por pestaña

---

### Caso 3: Cierre de Pestaña

**Escenario:**
1. Admin logueado en Pestaña A
2. Usuario cierra la pestaña (X)
3. Usuario abre nueva pestaña y navega a la app

**Resultado Esperado:**
- ✅ La nueva pestaña NO tiene sesión activa
- ✅ El usuario debe hacer login nuevamente
- ✅ sessionStorage se destruye al cerrar la pestaña

**Nota:** Si el usuario quiere mantener la sesión después de cerrar el navegador, tendríamos que usar `localStorage` con un mecanismo de "namespace por pestaña" (más complejo), pero la solución actual prioriza **seguridad sobre conveniencia**.

---

### Caso 4: Recarga de Página (F5)

**Escenario:**
1. Admin logueado en Pestaña A
2. Usuario presiona F5 (recarga)

**Resultado Esperado:**
- ✅ La sesión SE MANTIENE (sessionStorage persiste en recargas)
- ✅ El token JWT sigue disponible
- ✅ El usuario NO tiene que volver a loguearse

---

## 📊 Comparativa Técnica

| Característica | localStorage | sessionStorage |
|---------------|--------------|----------------|
| **Persistencia** | Hasta que se borre manualmente | Solo durante la sesión de la pestaña |
| **Compartido entre pestañas** | ✅ SÍ (problema) | ❌ NO (solución) |
| **Sobrevive al cerrar pestaña** | ✅ SÍ | ❌ NO |
| **Sobrevive a F5 (recarga)** | ✅ SÍ | ✅ SÍ |
| **Riesgo de contaminación** | 🔴 ALTO | 🟢 CERO |
| **Ideal para JWT** | ❌ NO | ✅ SÍ |

---

## 🚀 Instrucciones de Prueba

### 1. Compilar el proyecto
```bash
cd frontend-picante-ng
npm run build
```

### 2. Levantar el servidor de desarrollo
```bash
npm start -- --port 4201
```

### 3. Test de aislamiento de sesión

**Paso A: Login como Admin**
1. Abre http://localhost:4200/login
2. Credenciales: `admin` / `123456`
3. Verifica que aparece "Dashboard de Administrador"
4. Abre DevTools → Application → Session Storage → http://localhost:4200
5. Deberías ver: `user: {accessToken: "...", username: "admin", roles: ["ROLE_ADMIN"]}`

**Paso B: Login como Mozo en OTRA pestaña**
1. **Duplica la pestaña** (Ctrl+Shift+D o Cmd+Shift+D)
2. Haz logout (botón "Salir")
3. Login con: `mozo1` / `123456`
4. Verifica que aparece "Dashboard de Mesero"
5. Abre DevTools → Application → Session Storage
6. Deberías ver: `user: {accessToken: "...", username: "mozo1", roles: ["ROLE_MOZO"]}`

**Paso C: Verificar aislamiento**
1. Vuelve a la **primera pestaña** (Admin)
2. Navega al Dashboard de Admin
3. Intenta realizar una acción (cobrar una mesa, editar inventario)
4. ✅ **NO debería haber error 403**
5. ✅ La sesión de Admin NO se vio afectada por el login de Mozo

**Paso D: Test de logout**
1. En la pestaña de Mozo, haz logout
2. Vuelve a la pestaña de Admin
3. ✅ Admin sigue logueado sin problemas

---

## ⚠️ Consideraciones Importantes

### 1. **Sesión NO persiste al cerrar pestaña**

**Comportamiento:**
- Si el usuario cierra la pestaña, la sesión se pierde
- Al abrir una nueva pestaña, debe loguearse nuevamente

**Justificación:**
- Esto es el comportamiento esperado para aplicaciones con alta seguridad
- Similar a aplicaciones bancarias (no mantienen sesión al cerrar)

**Alternativa (si se requiere persistencia):**
- Implementar "Remember Me" con `localStorage` + identificador único de pestaña
- Usar cookies HttpOnly con atributo SameSite=Strict

---

### 2. **Guards y Navegación**

Si tienes un `AuthGuard` (canActivate), asegúrate de que use `AuthService.isAuthenticated()`:

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
```

---

### 3. **Logging para Debug**

Los console.log agregados te ayudarán a verificar el flujo:

```typescript
✓ Sesión almacenada en sessionStorage (aislada por pestaña)
✓ Sesión cerrada en esta pestaña (otras pestañas no afectadas)
```

---

## 🎓 Conceptos Clave de Seguridad

### 1. **Session Isolation (Aislamiento de Sesión)**
- Cada contexto de navegación (pestaña) es independiente
- Previene ataques de escalación de privilegios entre pestañas

### 2. **Principle of Least Privilege**
- Cada sesión solo tiene acceso a los recursos autorizados para SU token
- No hay "sangrado" de permisos entre sesiones

### 3. **Defense in Depth**
- Primera capa: sessionStorage (aislamiento)
- Segunda capa: JWT con expiración
- Tercera capa: Validación de roles en backend

---

## 📝 Checklist de Migración Completada

- ✅ AuthService refactorizado a sessionStorage
- ✅ AuthInterceptor actualizado
- ✅ ProductService usa sessionStorage
- ✅ UserService usa sessionStorage
- ✅ MeseroDashboardComponent usa sessionStorage
- ✅ Documentación completa creada
- ✅ Casos de uso documentados
- ✅ Instrucciones de prueba incluidas

---

## 🚨 Próximos Pasos Recomendados

### 1. **Implementar Refresh Token**
```typescript
// En AuthService
refreshToken(): Observable<any> {
  const user = this.getUser();
  return this.http.post(this.apiUrl + 'refresh', { refreshToken: user.refreshToken }).pipe(
    tap((response: any) => {
      if (response.accessToken) {
        sessionStorage.setItem('user', JSON.stringify(response));
      }
    })
  );
}
```

### 2. **Agregar Session Timeout**
```typescript
// Cerrar sesión automáticamente después de 30 min de inactividad
private sessionTimeout: any;

login(credentials: any): Observable<any> {
  return this.http.post(this.apiUrl + 'login', credentials).pipe(
    tap((response: any) => {
      if (response.accessToken) {
        sessionStorage.setItem('user', JSON.stringify(response));
        this.startSessionTimer();
      }
    })
  );
}

private startSessionTimer(): void {
  clearTimeout(this.sessionTimeout);
  this.sessionTimeout = setTimeout(() => {
    this.logout();
    alert('Sesión expirada por inactividad');
  }, 30 * 60 * 1000); // 30 minutos
}
```

### 3. **Agregar "Remember Me" (Opcional)**
Si los usuarios piden persistencia al cerrar pestaña:

```typescript
login(credentials: any, rememberMe: boolean = false): Observable<any> {
  return this.http.post(this.apiUrl + 'login', credentials).pipe(
    tap((response: any) => {
      if (response.accessToken) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(response));
      }
    })
  );
}
```

---

## 📞 Soporte

Si encuentras algún problema después de la migración:

1. Verifica que todas las referencias a `localStorage` fueron eliminadas
2. Comprueba que el navegador soporta sessionStorage (todos los navegadores modernos)
3. Revisa la consola para mensajes de log
4. Inspecciona Application → Session Storage en DevTools

---

**Fecha de Implementación:** 8 de Enero de 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Producción Ready
