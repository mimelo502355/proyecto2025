# Solución: Items no aparecen en el modal de cobro

## Problema
Los detalles de los pedidos (items) no aparecen en el modal de cobro, ni en el monitor de cocina.

## Causa Raíz
La mesa S1 está en estado `OPEN` y **no tiene ningún pedido confirmado con items**.

## Solución: Crear datos de prueba

### Opción 1: Ejecutar el script SQL
1. Abre MySQL Workbench o tu cliente MySQL favorito
2. Conecta a la base de datos `picantedb`
3. Copia y ejecuta el contenido de `database/test_order_with_items.sql`

Este script:
- Borra cualquier mesa/orden existente para la mesa 1
- Crea una mesa **S1** en estado **WAITING_PAYMENT**
- Crea una orden con **2 items** confirmados

### Opción 2: Hacerlo desde la aplicación
1. Abre la aplicación en el navegador
2. Ve a **Mesero Dashboard**
3. Selecciona una mesa (ej: S1)
4. Haz clic en **"Agregar Pedido"**
5. Selecciona 2-3 productos y haz clic en **"Confirmar Pedido"**
6. La mesa debería pasar a estado `READY_TO_KITCHEN`
7. Luego puedes ir a **Admin Dashboard** y hacer clic en **"Cobrar"** para ver los items

## Para Verificar

### Via MySQL
```sql
USE picantedb;
SELECT * FROM restaurant_tables WHERE id = 1;
SELECT * FROM restaurant_orders WHERE table_id = 1;
SELECT * FROM order_items WHERE order_id = (SELECT id FROM restaurant_orders WHERE table_id = 1 LIMIT 1);
```

### Via navegador (Console)
Al abrir el modal de cobro:
- Abre la consola (F12)
- Busca los logs `✅ Orden recibida del backend`
- Verifica que `Items count` sea mayor a 0
