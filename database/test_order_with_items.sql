-- Script para crear datos de prueba: mesa con pedido confirmado y items

USE picantedb;

-- 1. Asegurarse de que existe una mesa S1 en WAITING_PAYMENT
DELETE FROM restaurant_orders WHERE table_id = 1;
DELETE FROM restaurant_tables WHERE id = 1;

INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, created_at, updated_at)
VALUES (1, 'S1', 4, 'WAITING_PAYMENT', NOW(), NOW(), NOW());

-- 2. Crear una orden para esa mesa
INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at)
VALUES (1, 1, 'S1', 'WAITING_PAYMENT', 36.00, NOW(), NOW());

-- Obtener el ID de la orden recién creada
SET @order_id = LAST_INSERT_ID();

-- 3. Agregar items a la orden
-- Primero obtener 2 productos de la BD
SET @product_1 = (SELECT id FROM products LIMIT 1);
SET @product_2 = (SELECT id FROM products LIMIT 1 OFFSET 1);

-- Insertar items para esa orden
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at)
VALUES 
    (@order_id, @product_1, (SELECT name FROM products WHERE id = @product_1), 1, (SELECT price FROM products WHERE id = @product_1), (SELECT price FROM products WHERE id = @product_1), NOW(), NOW()),
    (@order_id, @product_2, (SELECT name FROM products WHERE id = @product_2), 1, (SELECT price FROM products WHERE id = @product_2), (SELECT price FROM products WHERE id = @product_2), NOW(), NOW());

-- Verificar que los datos se insertaron correctamente
SELECT 'Mesa S1 creada con estado WAITING_PAYMENT' AS resultado;
SELECT * FROM restaurant_tables WHERE id = 1;

SELECT 'Orden creada:' AS resultado;
SELECT * FROM restaurant_orders WHERE table_id = 1;

SELECT 'Items de la orden:' AS resultado;
SELECT * FROM order_items WHERE order_id = @order_id;
