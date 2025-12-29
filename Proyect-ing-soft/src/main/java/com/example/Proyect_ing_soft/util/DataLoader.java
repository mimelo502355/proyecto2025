package com.example.Proyect_ing_soft.util;

import com.example.Proyect_ing_soft.model.*;
import com.example.Proyect_ing_soft.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private TableRepository tableRepository;
    @Autowired
    private PasswordEncoder encoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- CARGANDO MENÚ DE 'EL PICANTE' ---");

        // 1. ROLES
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(RoleName.ROLE_ADMIN));
            roleRepository.save(new Role(RoleName.ROLE_MOZO));
            roleRepository.save(new Role(RoleName.ROLE_COCINA));
        }

        // 2. CATEGORÍAS (Basadas en las imágenes del menú)
        // Guardamos las referencias para usarlas al crear productos
        Category catCombinados = crearCategoriaSiNoExiste("Combinados Carretilleros");
        Category catExtras = crearCategoriaSiNoExiste("Platos Extras");
        Category catFrituras = crearCategoriaSiNoExiste("Frituras");
        Category catPorciones = crearCategoriaSiNoExiste("Porciones");
        Category catChilcanos = crearCategoriaSiNoExiste("Chilcanos");
        Category catCevichop = crearCategoriaSiNoExiste("Cevichop en Copa");
        Category catCeviches = crearCategoriaSiNoExiste("Ceviches");
        Category catCausas = crearCategoriaSiNoExiste("Causas");
        Category catArroces = crearCategoriaSiNoExiste("Arroces");
        Category catChicharrones = crearCategoriaSiNoExiste("Chicharrones y Jaleas");
        Category catSudados = crearCategoriaSiNoExiste("Sudados y Parihuelas");
        Category catDuos = crearCategoriaSiNoExiste("Duos");
        Category catTrios = crearCategoriaSiNoExiste("Trios");
        Category catChanchos = crearCategoriaSiNoExiste("Chanchos del Picante");
        Category catBebidas = crearCategoriaSiNoExiste("Bebidas");

        // 3. PRODUCTOS (Datos reales extraídos de las imágenes)
        if (productRepository.count() == 0) {
            
            // --- COMBINADOS CARRETILLEROS ---
            crearProducto("Combinado Manchapecho 4x4", 14.00, "Chanfainita + Tallarín + Crema a la Huancaína + Ceviche", catCombinados);
            crearProducto("Manchapecho Taypa 4x4", 17.00, "Chanfainita + Tallarín + Crema a la Huancaína + Ceviche (Porción Taypa)", catCombinados);
            crearProducto("Combinado Picantero 7 Colores", 22.00, "Chanfainita + Tallarín + Ceviche + Huancaína + Chicharrón de Pota", catCombinados);
            crearProducto("Cuadro El Picante", 25.00, "Arroz con Mariscos + Ceviche + Tallarín + Chanfainita + Huancaína", catCombinados);

            // --- PLATOS EXTRAS ---
            crearProducto("Lomo Saltado", 25.00, "Clásico lomo saltado al jugo", catExtras);
            crearProducto("Tallarín Saltado de Pollo", 23.00, "Tallarín saltado criollo con pollo", catExtras);
            crearProducto("Fetuchini a la Huancaína con Lomo", 28.00, "Pasta en salsa huancaína con lomo saltado", catExtras);
            crearProducto("Pollo a la Plancha con Papa Nativa", 24.00, "Filete de pollo dorado con papas andinas", catExtras);

            // --- FRITURAS ---
            crearProducto("Lenguado Frito", 30.00, "Lenguado fresco frito con guarnición", catFrituras);
            crearProducto("Jalea Real", 38.00, "Pescado entero empanizado con chicharrones de mixtura de mariscos", catChicharrones); // Movi Jalea aquí por lógica o dejar en Frituras
            crearProducto("Chita Frita", 28.00, "Pescado Chita frito crocante", catFrituras);

            // --- CEVICHES ---
            crearProducto("Ceviche Clásico", 18.00, "Pura pulpa de jurel con sus infaltables guarniciones", catCeviches);
            crearProducto("Ceviche Especial", 25.00, "A base de pescado blanco marinado en crema de rocoto", catCeviches);
            crearProducto("Ceviche Mixto", 30.00, "A base de pescado blanco y mixtura de mariscos", catCeviches);
            crearProducto("Ceviche Carretillero", 28.00, "Ceviche a base de jurel al estilo Picante con chicharrón de pota", catCeviches);

            // --- CEVICHOP EN COPA ---
            crearProducto("Cevichop Clásica", 15.00, "Pulpa de jurel en gajos marinados al estilo picante", catCevichop);
            crearProducto("Cevichop al Rocoto", 18.00, "Pulpa de jurel en gajos marinados en crema rocoto", catCevichop);
            crearProducto("Cevichop 3 Diablos", 20.00, "Pulpa de jurel marinado en crema de 3 ajíes bien picante", catCevichop);

            // --- CAUSAS ---
            crearProducto("Causa Acevichada", 20.00, "Causa rellena coronada con ceviche", catCausas);
            crearProducto("Causa con Langostinos Fritos", 28.00, "Masa de papa amarilla con langostinos crocantes", catCausas);
            crearProducto("Causa Duo 1 con Chicharrón", 30.00, "Causa + Chicharrón de Pescado", catCausas);

            // --- ARROCES ---
            crearProducto("Arroz con Mariscos", 25.00, "Deliciosa preparación combinando sabor y texturas del mar", catArroces);
            crearProducto("Chaufa de Mariscos", 26.00, "Mix de mariscos con toques orientales y de la casa", catArroces);
            crearProducto("Risoto de Langostinos", 31.00, "Mezcla perfecta entre sabor y textura con la delicia del mar y ají amarillo", catArroces);

            // --- CHICHARRONES ---
            crearProducto("Chicharrón de Pescado", 27.00, "Trozos de pescado crujientes y sabrosos con yucas", catChicharrones);
            crearProducto("Chicharrón de Pota", 25.00, "Pota en tiras crujientes servido con yucas fritas", catChicharrones);
            crearProducto("Jalea Simple", 33.00, "Crujiente combinación de chicharrones de pescado, cangrejo y marisco", catChicharrones);

            // --- SUDADOS Y PARIHUELAS ---
            crearProducto("Chupe de Camarones", 32.00, "Sopita costeña con camarones frescos", catSudados);
            crearProducto("Sudado de Pescado", 30.00, "Pescado con la sazón de la casa y el infaltable yuca sancochada", catSudados);
            crearProducto("Sudado de Lenguado", 35.00, "Trucha entera con la sazón de la casa (Nota: imagen dice trucha/lenguado)", catSudados);

            // --- DUOS Y TRIOS ---
            crearProducto("Dúo Clásico 1", 25.00, "Ceviche + Arroz con Mariscos", catDuos);
            crearProducto("Dúo El Picante 1", 30.00, "Ceviche Mixto + Arroz con Mariscos", catDuos);
            crearProducto("Trío Clásico 1", 35.00, "Ceviche + Chicharrón de Pescado + Arroz con Mariscos", catTrios);
            crearProducto("Trío Bravaso", 30.00, "Ceviche Mixto + Chicharrón de Pescado + Chanfainita", catTrios);
            crearProducto("Ronda Pikisiki", 55.00, "Chanfainita + Ceviche + Causa + Chicharrón de Pota + Arroz con Mariscos + Leche de Tigre", catTrios);

            // --- CHANCHOS DEL PICANTE ---
            crearProducto("Caja China Mixta", 35.00, "Trozo de chancho + Pollo ahumado + Chorizo + Papas + Tamal", catChanchos);
            crearProducto("Lechón Mixto Estilo El Picante", 35.00, "Lechón al horno jugoso + Pollo al horno + Papas", catChanchos);
            crearProducto("Chicharrón de Costillas", 30.00, "Costillas de cerdo jugoso + Papas + Ensalada", catChanchos);

            // --- BEBIDAS ---
            crearProducto("Chicha Morada (Jarra)", 10.00, "1 Jarra de chicha morada casera", catBebidas);
            crearProducto("Limonada (Jarra)", 10.00, "1 Jarra de limonada fresca", catBebidas);
            crearProducto("Inca Kola 1L", 8.00, "Gaseosa de vidrio 1 Litro", catBebidas);
            crearProducto("Cerveza Cusqueña Dorada 620", 10.00, "Cerveza botella grande", catBebidas);
            
            System.out.println("> ¡Productos del Menú cargados!");
        }

        // 4. MESAS
        if (tableRepository.count() == 0) {
            tableRepository.save(new RestaurantTable("Mesa 1 (Ventana)", 4, "Disponible"));
            tableRepository.save(new RestaurantTable("Mesa 2 (Centro)", 2, "Disponible"));
            tableRepository.save(new RestaurantTable("Mesa 3 (Familiar)", 6, "Ocupada"));
            tableRepository.save(new RestaurantTable("Mesa 4 (Terraza)", 4, "Disponible"));
        }

        // 5. USUARIOS
        crearUsuarioSiNoExiste("admin", "admin@picante.com", "123456", RoleName.ROLE_ADMIN);
        crearUsuarioSiNoExiste("mozo1", "mozo@picante.com", "123456", RoleName.ROLE_MOZO);
        crearUsuarioSiNoExiste("chef1", "cocina@picante.com", "123456", RoleName.ROLE_COCINA);
        
        System.out.println("--- CARGA COMPLETA ---");
    }

    // --- MÉTODOS AUXILIARES PARA NO REPETIR CÓDIGO ---

    private Category crearCategoriaSiNoExiste(String name) {
        return categoryRepository.findByName(name)
                .orElseGet(() -> categoryRepository.save(new Category(name)));
    }

    private void crearProducto(String name, Double price, String description, Category category) {
        Product p = new Product();
        p.setName(name);
        p.setPrice(price);
        p.setDescription(description);
        p.setAvailable(true);
        p.setCategory(category);
        productRepository.save(p);
    }

    private void crearUsuarioSiNoExiste(String username, String email, String password, RoleName roleName) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(encoder.encode(password));
            user.setAccountNonLocked(true);

            Set<Role> roles = new HashSet<>();
            Role userRole = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado."));
            roles.add(userRole);
            user.setRoles(roles);

            userRepository.save(user);
        }
    }
}