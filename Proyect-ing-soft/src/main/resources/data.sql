-- Database Initialization Script
-- Replaces Java DataLoader
-- Run this script to populate the database

CREATE DATABASE IF NOT EXISTS picantedb;

USE picantedb;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. ROLES
INSERT IGNORE INTO
    roles (name)
VALUES ('ROLE_ADMIN'),
    ('ROLE_MOZO'),
    ('ROLE_COCINA');

-- 2. CATEGORIES
INSERT IGNORE INTO
    categories (name)
VALUES ('Combinados Carretilleros'),
    ('Platos Extras'),
    ('Frituras'),
    ('Porciones'),
    ('Chilcanos'),
    ('Cevichop en Copa'),
    ('Ceviches'),
    ('Causas'),
    ('Arroces'),
    ('Chicharrones y Jaleas'),
    ('Sudados y Parihuelas'),
    ('Duos'),
    ('Trios'),
    ('Chanchos del Picante'),
    ('Bebidas');

-- 3. PRODUCTS
-- Using subqueries to get category IDs
INSERT IGNORE INTO
    products (
        name,
        price,
        description,
        available,
        category_id
    )
VALUES (
        'Combinado Manchapecho 4x4',
        14.00,
        'Chanfainita + Tallarín + Crema a la Huancaína + Ceviche',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Combinados Carretilleros'
        )
    ),
    (
        'Manchapecho Taypa 4x4',
        17.00,
        'Chanfainita + Tallarín + Crema a la Huancaína + Ceviche (Porción Taypa)',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Combinados Carretilleros'
        )
    ),
    (
        'Combinado Picantero 7 Colores',
        22.00,
        'Chanfainita + Tallarín + Ceviche + Huancaína + Chicharrón de Pota',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Combinados Carretilleros'
        )
    ),
    (
        'Cuadro El Picante',
        25.00,
        'Arroz con Mariscos + Ceviche + Tallarín + Chanfainita + Huancaína',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Combinados Carretilleros'
        )
    ),
    (
        'Lomo Saltado',
        25.00,
        'Clásico lomo saltado al jugo',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Platos Extras'
        )
    ),
    (
        'Tallarín Saltado de Pollo',
        23.00,
        'Tallarín saltado criollo con pollo',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Platos Extras'
        )
    ),
    (
        'Fetuchini a la Huancaína con Lomo',
        28.00,
        'Pasta en salsa huancaína con lomo saltado',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Platos Extras'
        )
    ),
    (
        'Pollo a la Plancha con Papa Nativa',
        24.00,
        'Filete de pollo dorado con papas andinas',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Platos Extras'
        )
    ),
    (
        'Lenguado Frito',
        30.00,
        'Lenguado fresco frito con guarnición',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Frituras'
        )
    ),
    (
        'Chita Frita',
        28.00,
        'Pescado Chita frito crocante',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Frituras'
        )
    ),
    (
        'Ceviche Clásico',
        18.00,
        'Pura pulpa de jurel con sus infaltables guarniciones',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Ceviches'
        )
    ),
    (
        'Ceviche Especial',
        25.00,
        'A base de pescado blanco marinado en crema de rocoto',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Ceviches'
        )
    ),
    (
        'Ceviche Mixto',
        30.00,
        'A base de pescado blanco y mixtura de mariscos',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Ceviches'
        )
    ),
    (
        'Ceviche Carretillero',
        28.00,
        'Ceviche a base de jurel al estilo Picante con chicharrón de pota',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Ceviches'
        )
    ),
    (
        'Cevichop Clásica',
        15.00,
        'Pulpa de jurel en gajos marinados al estilo picante',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Cevichop en Copa'
        )
    ),
    (
        'Cevichop al Rocoto',
        18.00,
        'Pulpa de jurel en gajos marinados en crema rocoto',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Cevichop en Copa'
        )
    ),
    (
        'Cevichop 3 Diablos',
        20.00,
        'Pulpa de jurel marinado en crema de 3 ajíes bien picante',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Cevichop en Copa'
        )
    ),
    (
        'Causa Acevichada',
        20.00,
        'Causa rellena coronada con ceviche',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Causas'
        )
    ),
    (
        'Causa con Langostinos Fritos',
        28.00,
        'Masa de papa amarilla con langostinos crocantes',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Causas'
        )
    ),
    (
        'Causa Duo 1 con Chicharrón',
        30.00,
        'Causa + Chicharrón de Pescado',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Causas'
        )
    ),
    (
        'Arroz con Mariscos',
        25.00,
        'Deliciosa preparación combinando sabor y texturas del mar',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Arroces'
        )
    ),
    (
        'Chaufa de Mariscos',
        26.00,
        'Mix de mariscos con toques orientales y de la casa',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Arroces'
        )
    ),
    (
        'Risoto de Langostinos',
        31.00,
        'Mezcla perfecta entre sabor y textura con la delicia del mar y ají amarillo',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Arroces'
        )
    ),
    (
        'Chicharrón de Pescado',
        27.00,
        'Trozos de pescado crujientes y sabrosos con yucas',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Chicharrones y Jaleas'
        )
    ),
    (
        'Chicharrón de Pota',
        25.00,
        'Pota en tiras crujientes servido con yucas fritas',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Chicharrones y Jaleas'
        )
    ),
    (
        'Jalea Simple',
        33.00,
        'Crujiente combinación de chicharrones de pescado, cangrejo y marisco',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Chicharrones y Jaleas'
        )
    ),
    (
        'Jalea Real',
        38.00,
        'Pescado entero empanizado con chicharrones de mixtura de mariscos',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Chicharrones y Jaleas'
        )
    ),
    (
        'Chupe de Camarones',
        32.00,
        'Sopita costeña con camarones frescos',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Sudados y Parihuelas'
        )
    ),
    (
        'Sudado de Pescado',
        30.00,
        'Pescado con la sazón de la casa y el infaltable yuca sancochada',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Sudados y Parihuelas'
        )
    ),
    (
        'Sudado de Lenguado',
        35.00,
        'Trucha entera con la sazón de la casa (Nota: imagen dice trucha/lenguado)',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Sudados y Parihuelas'
        )
    ),
    (
        'Dúo Clásico 1',
        25.00,
        'Ceviche + Arroz con Mariscos',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Duos'
        )
    ),
    (
        'Dúo El Picante 1',
        30.00,
        'Ceviche Mixto + Arroz con Mariscos',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Duos'
        )
    ),
    (
        'Trío Clásico 1',
        35.00,
        'Ceviche + Chicharrón de Pescado + Arroz con Mariscos',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Trios'
        )
    ),
    (
        'Trío Bravaso',
        30.00,
        'Ceviche Mixto + Chicharrón de Pescado + Chanfainita',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Trios'
        )
    ),
    (
        'Ronda Pikisiki',
        55.00,
        'Chanfainita + Ceviche + Causa + Chicharrón de Pota + Arroz con Mariscos + Leche de Tigre',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Trios'
        )
    ),
    (
        'Caja China Mixta',
        35.00,
        'Trozo de chancho + Pollo ahumado + Chorizo + Papas + Tamal',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Chanchos del Picante'
        )
    ),
    (
        'Lechón Mixto Estilo El Picante',
        35.00,
        'Lechón al horno jugoso + Pollo al horno + Papas',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Chanchos del Picante'
        )
    ),
    (
        'Chicharrón de Costillas',
        30.00,
        'Costillas de cerdo jugoso + Papas + Ensalada',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Chanchos del Picante'
        )
    ),
    (
        'Chicha Morada (Jarra)',
        10.00,
        '1 Jarra de chicha morada casera',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Bebidas'
        )
    ),
    (
        'Limonada (Jarra)',
        10.00,
        '1 Jarra de limonada fresca',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Bebidas'
        )
    ),
    (
        'Inca Kola 1L',
        8.00,
        'Gaseosa de vidrio 1 Litro',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Bebidas'
        )
    ),
    (
        'Cerveza Cusqueña Dorada 620',
        10.00,
        'Cerveza botella grande',
        1,
        (
            SELECT id
            FROM categories
            WHERE
                name = 'Bebidas'
        )
    );

-- 4. TABLES
DELETE FROM restaurant_tables;

INSERT IGNORE INTO
    restaurant_tables (name, capacity, status)
VALUES ('S1', 4, 'AVAILABLE'),
    ('S2', 4, 'AVAILABLE'),
    ('S3', 4, 'AVAILABLE'),
    ('S4', 4, 'AVAILABLE'),
    ('S5', 4, 'AVAILABLE'),
    ('S6', 4, 'AVAILABLE'),
    ('S7', 4, 'AVAILABLE'),
    ('S8', 4, 'AVAILABLE'),
    ('S9', 4, 'AVAILABLE'),
    ('S10', 4, 'AVAILABLE'),
    ('P1', 4, 'AVAILABLE'),
    ('P2', 4, 'AVAILABLE'),
    ('P3', 4, 'AVAILABLE'),
    ('P4', 4, 'AVAILABLE'),
    ('P5', 4, 'AVAILABLE'),
    ('P6', 4, 'AVAILABLE'),
    ('P7', 4, 'AVAILABLE'),
    ('P8', 4, 'AVAILABLE'),
    ('P9', 4, 'AVAILABLE'),
    ('P10', 4, 'AVAILABLE'),
    ('P11', 4, 'AVAILABLE'),
    ('P12', 4, 'AVAILABLE'),
    ('P13', 4, 'AVAILABLE'),
    ('P14', 4, 'AVAILABLE'),
    ('P15', 4, 'AVAILABLE'),
    ('P16', 4, 'AVAILABLE'),
    ('P17', 4, 'AVAILABLE'),
    ('P18', 4, 'AVAILABLE'),
    ('P19', 4, 'AVAILABLE'),
    ('P20', 4, 'AVAILABLE');

INSERT INTO
    users (
        username,
        email,
        password,
        account_non_locked
    )
VALUES (
        'admin',
        'admin@picante.com',
        '123456',
        1
    ),
    (
        'mozo1',
        'mozo@picante.com',
        '123456',
        1
    ),
    (
        'chef1',
        'cocina@picante.com',
        '123456',
        1
    );

-- 6. USER ROLES
-- Linking users to roles
INSERT IGNORE INTO
    user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE
    u.username = 'admin'
    AND r.name = 'ROLE_ADMIN';

INSERT IGNORE INTO
    user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE
    u.username = 'mozo1'
    AND r.name = 'ROLE_MOZO';

INSERT IGNORE INTO
    user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE
    u.username = 'chef1'
    AND r.name = 'ROLE_COCINA';

SET FOREIGN_KEY_CHECKS = 1;