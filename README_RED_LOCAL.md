# 🌶️ Sistema Picante - Configuración de Red Local

## 📋 Requisitos Previos
- Windows 10/11
- Java 17 instalado
- Node.js 18+ instalado
- MySQL 8.0 corriendo en el puerto 3306
- Base de datos `picantedb` creada

## 🚀 Inicio Rápido

### 1️⃣ Configurar el Dominio (Una sola vez)

**Ejecutar como Administrador:**

```powershell
cd "c:\Users\USERS\Desktop\clon repo ds2"
.\configurar-dominio.ps1
```

Este script:
- ✅ Detecta tu IP local automáticamente
- ✅ Configura el archivo hosts de Windows
- ✅ Agrega reglas de firewall para los puertos 8080 y 4201
- ✅ Te muestra instrucciones para configurar otros dispositivos

### 2️⃣ Iniciar el Sistema

**Ejecutar en PowerShell normal:**

```powershell
cd "c:\Users\USERS\Desktop\clon repo ds2"
.\iniciar-sistema.ps1
```

Esto iniciará:
- 🔧 Backend (Spring Boot) en puerto 8080
- 🎨 Frontend (Angular) en puerto 4201

## 🌐 Acceso al Sistema

### Desde tu PC:
- `http://localhost:4201`
- `http://picante-sistema.com:4201`

### Desde otros dispositivos en tu red:
- `http://TU_IP:4201` (ejemplo: `http://192.168.1.100:4201`)
- `http://picante-sistema.com:4201` (si configuraron el hosts en ese dispositivo)

## 📱 Configurar Otros Dispositivos

Para que otros celulares, tablets o PCs accedan usando `http://picante-sistema.com:4201`:

### Windows (Otros PCs)
1. Abrir Notepad como **Administrador**
2. Abrir: `C:\Windows\System32\drivers\etc\hosts`
3. Agregar al final:
   ```
   192.168.1.100    picante-sistema.com
   ```
   *(Reemplaza `192.168.1.100` con la IP que te mostró el script)*
4. Guardar y cerrar

### Mac
1. Abrir Terminal
2. Ejecutar: `sudo nano /etc/hosts`
3. Agregar la línea: `192.168.1.100    picante-sistema.com`
4. Guardar: `Ctrl+O`, Enter, `Ctrl+X`

### Linux
1. Abrir Terminal
2. Ejecutar: `sudo nano /etc/hosts`
3. Agregar la línea: `192.168.1.100    picante-sistema.com`
4. Guardar y salir

### Android (Requiere Root)
1. Instalar app "Hosts Editor" desde Play Store
2. Agregar entrada: `192.168.1.100 picante-sistema.com`

### iOS
1. Instalar app "Surge" o "Shadowrocket"
2. Configurar DNS local con la IP y dominio

### ⚡ Alternativa Simple (Sin configurar hosts)
Si no quieres configurar el archivo hosts en cada dispositivo, simplemente usa la IP directamente:

```
http://192.168.1.100:4201
```

## 👥 Usuarios del Sistema

| Rol    | Usuario  | Contraseña |
|--------|----------|------------|
| Admin  | admin    | 123456     |
| Mesero | mozo1    | 123456     |
| Chef   | cocina1  | 123456     |

## 🔧 Configuraciones Técnicas

### Backend (Spring Boot)
- **Puerto:** 8080
- **Escucha en:** 0.0.0.0 (todas las interfaces)
- **CORS permitido desde:**
  - `http://localhost:4201`
  - `http://picante-sistema.com:4201`
  - Cualquier IP en la red local

### Frontend (Angular)
- **Puerto:** 4201
- **Escucha en:** 0.0.0.0 (todas las interfaces)
- **API Backend:** Se conecta a `http://localhost:8080`

### Base de Datos (MySQL)
- **Puerto:** 3306
- **Base de datos:** picantedb
- **Usuario:** root
- **Contraseña:** root

## 🛡️ Seguridad y Firewall

El script de configuración agrega estas reglas automáticamente:
- Puerto 8080 (Backend) - Entrada permitida
- Puerto 4201 (Frontend) - Entrada permitida

Si el firewall bloquea las conexiones, ejecuta manualmente:

```powershell
# Como Administrador
New-NetFirewallRule -DisplayName "Picante Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Picante Frontend" -Direction Inbound -LocalPort 4201 -Protocol TCP -Action Allow
```

## 📊 Funcionalidades del Sistema

### Panel de Administrador
- 📈 Reportes de ventas (día/semana/mes)
- 💰 Gestión de pagos con DNI/RUC
- 🧾 Emisión de comprobantes
- 📦 Control de inventario
- 🍽️ Gestión de carta/menú
- 🚚 Pedidos delivery

### Panel de Mesero
- 📋 Gestión de mesas
- 🛎️ Toma de pedidos
- 👨‍🍳 Envío a cocina
- 💳 Proceso de pago

### Panel de Cocina
- 📝 Lista de pedidos pendientes
- ⏱️ Control de tiempos de preparación
- ✅ Actualización de estados

## 🔄 Actualizar el Sistema

Después de hacer cambios en el código:

### Backend:
```powershell
cd "c:\Users\USERS\Desktop\clon repo ds2\Proyect-ing-soft"
mvn clean package -DskipTests
```

### Frontend:
```powershell
cd "c:\Users\USERS\Desktop\clon repo ds2\frontend-picante-ng"
npm run build
```

Luego ejecuta `.\iniciar-sistema.ps1` nuevamente.

## 🐛 Solución de Problemas

### "No puedo acceder desde otro dispositivo"
1. Verifica que ambos dispositivos estén en la misma red WiFi
2. Confirma que el firewall permite los puertos 8080 y 4201
3. Prueba accediendo con la IP directa primero: `http://192.168.1.100:4201`

### "El dominio picante-sistema.com no funciona"
1. Verifica que el archivo hosts esté configurado correctamente
2. Prueba hacer ping: `ping picante-sistema.com`
3. Reinicia el navegador o limpia la caché DNS: `ipconfig /flushdns`

### "Error al iniciar el backend"
1. Verifica que MySQL esté corriendo
2. Confirma que la base de datos `picantedb` existe
3. Revisa los logs en la ventana de PowerShell del backend

### "Error al iniciar el frontend"
1. Ejecuta `npm install` en la carpeta del frontend
2. Verifica que el puerto 4201 no esté en uso
3. Revisa los logs en la ventana de PowerShell del frontend

## 📞 Soporte

Si tienes problemas, revisa los logs en las ventanas de PowerShell minimizadas donde corren el backend y frontend.

---

**Desarrollado con ❤️ para El Picante Restaurant**
