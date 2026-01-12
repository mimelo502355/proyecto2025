-- Script para actualizar el menú completo de Restaurant "El Picante"
-- Ejecutar este script después de tener el sistema levantado

USE picantedb;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Limpiar productos existentes
DELETE FROM order_items;
DELETE FROM products;
DELETE FROM categories;

-- 2. Reiniciar AUTO_INCREMENT
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;

-- 3. Insertar nuevas categorías
INSERT INTO categories (name) VALUES 
('Barra Cevichera'),
('Entradas Calientes'),
('Fondos Marinos y Criollos'),
('Rondas Para Compartir'),
('Bebidas');

-- 4. Insertar nuevos productos
INSERT INTO products (name, price, description, available, category_id) VALUES 
-- BARRA CEVICHERA (Nuestra especialidad)
('Ceviche Clásico', 32.00, 'Pesca del día, leche de tigre tradicional, camote y choclo', 1, 1),
('Ceviche "El Picante"', 35.00, 'Mixto con crema de rocoto ahumado y chicharrón de pota', 1, 1),
('Tiradito al Ají Amarillo', 30.00, 'Láminas de pescado en crema de ají amarillo y maíz chulpi', 1, 1),
('Leche de Tigre "Levántate Lázaro"', 18.00, 'Potente concentrado con trozos de pescado y mariscos', 1, 1),

-- ENTRADAS CALIENTES
('Jalea Real', 38.00, 'Mixtura de mariscos y pescado crocante con salsa tártara y criolla', 1, 2),
('Causa Limeña de Langostinos', 24.00, 'Papa amarilla prensada rellena de palta y langostinos en salsa golf', 1, 2),
('Wantanes de Pulpa de Cangrejo', 22.00, 'Fritos y servidos con salsa de tamarindo', 1, 2),

-- FONDOS MARINOS Y CRIOLLOS
('Arroz con Mariscos "El Picante"', 36.00, 'Arroz meloso al wok con frutos del mar y toque de parmesano', 1, 3),
('Tacu Tacu en Salsa de Mariscos', 38.00, 'Frijol y arroz dorado cubierto con cremosa salsa de mariscos', 1, 3),
('Lomo Saltado Clásico', 40.00, 'Trozos de lomo fino al wok, cebolla, tomate, papas fritas y arroz', 1, 3),
('Chaufa Amazónico con Cecina', 34.00, 'Arroz chaufa con cecina, plátano maduro y huevo', 1, 3),

-- RONDAS PARA COMPARTIR
('Ronda Fría', 55.00, 'Ceviche clásico + Causa de pulpo + Tiradito bicolor', 1, 4),
('Ronda Caliente', 60.00, 'Arroz con mariscos + Chicharrón de pescado + Chaufa de mariscos', 1, 4),

-- BEBIDAS
('Chicha Morada (Tarro)', 12.00, 'Refrescante chicha morada tradicional en tarro', 1, 5),
('Chicha de Maracuyá (Tarro)', 12.00, 'Refrescante chicha de maracuyá en tarro', 1, 5),
('Gaseosa Personal', 2.50, 'Gaseosa personal 350ml', 1, 5),
('Gaseosa 1 Litro', 10.00, 'Gaseosa de 1 litro', 1, 5),
('Gaseosa Gordita-Jumbo', 5.00, 'Gaseosa tamaño jumbo 500ml', 1, 5),
('Gaseosa 2.5L', 15.00, 'Gaseosa de 2.5 litros', 1, 5),
('Agua Mineral (1/2 L)', 2.50, 'Agua mineral de medio litro', 1, 5),
('Cerveza Pilsen 630', 10.00, 'Cerveza Pilsen de 630ml', 1, 5),
('Cerveza Trigo 620', 10.00, 'Cerveza Trigo de 620ml', 1, 5);

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que se insertaron correctamente
SELECT 'CATEGORÍAS:' as titulo;
SELECT * FROM categories;

SELECT 'PRODUCTOS POR CATEGORÍA:' as titulo;
SELECT 
    c.name as categoria,
    p.name as producto,
    p.price as precio,
    p.description as descripcion
FROM products p 
JOIN categories c ON p.category_id = c.id
ORDER BY c.id, p.name;