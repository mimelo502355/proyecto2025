-- Script para crear datos de prueba con órdenes confirmadas que tengan items

USE picantedb;

-- Deshabilitar constraints de foreign key
SET FOREIGN_KEY_CHECKS=0;

-- 1. Limpiar datos anteriores
DELETE FROM order_items WHERE order_id IN (SELECT id FROM restaurant_orders WHERE table_id IN (1, 2, 3, 4, 5));
DELETE FROM restaurant_orders WHERE table_id IN (1, 2, 3, 4, 5);
DELETE FROM restaurant_tables WHERE id IN (1, 2, 3, 4, 5);

-- Re-habilitar constraints
SET FOREIGN_KEY_CHECKS=1;

-- 2. Crear 5 mesas de prueba con diferentes estados

-- Mesa 1: WAITING_KITCHEN (con pedido confirmado y items)
INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, preparation_at)
VALUES (1, 'S1', 4, 'WAITING_KITCHEN', NOW(), NULL);

INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount)
VALUES (1, 1, 'S1', 'OPEN', 0);

SET @order_id_1 = LAST_INSERT_ID();

-- Agregar 2 items a la mesa 1
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at)
VALUES 
    (@order_id_1, 1, 'Combinado Manchapecho 4x4', 1, 14.00, 14.00, NOW(), NOW()),
    (@order_id_1, 5, 'Lomo Saltado', 1, 25.00, 25.00, NOW(), NOW());

-- Actualizar el total
UPDATE restaurant_orders SET total_amount = 39.00 WHERE id = @order_id_1;

-- Mesa 2: PREPARING (con pedido y items)
INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, preparation_at, created_at, updated_at)
VALUES (2, 'S2', 4, 'PREPARING', NOW(), DATE_SUB(NOW(), INTERVAL 3 MINUTE), NOW(), NOW());

INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at)
VALUES (2, 2, 'S2', 'OPEN', 0, DATE_SUB(NOW(), INTERVAL 8 MINUTE), NOW());

SET @order_id_2 = LAST_INSERT_ID();

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at)
VALUES 
    (@order_id_2, 2, 'Manchapecho Taypa 4x4', 1, 17.00, 17.00, NOW(), NOW()),
    (@order_id_2, 6, 'Ceviche de Pescado', 1, 18.00, 18.00, NOW(), NOW()),
    (@order_id_2, 15, 'Coca Cola', 2, 5.00, 10.00, NOW(), NOW());

UPDATE restaurant_orders SET total_amount = 45.00 WHERE id = @order_id_2;

-- Mesa 3: READY (pedido listo)
INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, preparation_at, created_at, updated_at)
VALUES (3, 'S3', 2, 'READY', NOW(), DATE_SUB(NOW(), INTERVAL 10 MINUTE), NOW(), NOW());

INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at)
VALUES (3, 3, 'S3', 'OPEN', 0, DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW());

SET @order_id_3 = LAST_INSERT_ID();

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at)
VALUES 
    (@order_id_3, 3, 'Combinado Picantero 7 Colores', 1, 22.00, 22.00, NOW(), NOW());

UPDATE restaurant_orders SET total_amount = 22.00 WHERE id = @order_id_3;

-- Mesa 4: WAITING_PAYMENT (lista para cobrar)
INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, created_at, updated_at)
VALUES (4, 'S4', 6, 'WAITING_PAYMENT', NOW(), NOW(), NOW());

INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at)
VALUES (4, 4, 'S4', 'WAITING_PAYMENT', 0, DATE_SUB(NOW(), INTERVAL 20 MINUTE), NOW());

SET @order_id_4 = LAST_INSERT_ID();

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at)
VALUES 
    (@order_id_4, 4, 'Cuadro El Picante', 2, 25.00, 50.00, NOW(), NOW()),
    (@order_id_4, 7, 'Causa Limeña', 1, 12.00, 12.00, NOW(), NOW());

UPDATE restaurant_orders SET total_amount = 62.00 WHERE id = @order_id_4;

-- Mesa 5: AVAILABLE (vacía)
INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, created_at, updated_at)
VALUES (5, 'S5', 4, 'AVAILABLE', NULL, NOW(), NOW());

-- Verificar que los datos se insertaron correctamente
SELECT 'OK' as resultado;
