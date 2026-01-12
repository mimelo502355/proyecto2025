package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.Product;
import com.example.Proyect_ing_soft.model.Category;
import com.example.Proyect_ing_soft.repository.DeliveryOrderItemRepository;
import com.example.Proyect_ing_soft.repository.ProductRepository;
import com.example.Proyect_ing_soft.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    ProductRepository productRepository;

    @Autowired
    CategoryRepository categoryRepository;

    @Autowired
    DeliveryOrderItemRepository deliveryOrderItemRepository;

    // 1. LISTAR TODOS LOS PRODUCTOS (Público - RF-27)
    // Cualquiera puede ver el menú, no necesita login
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // 2. OBTENER UN PRODUCTO POR ID (Público)
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));
        return ResponseEntity.ok(product);
    }

    // 3. CREAR PRODUCTO (Solo Admin - RF-24)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // <--- Aquí usamos la seguridad del Token
    public Product createProduct(@RequestBody ProductRequest productRequest) {
        Product product = new Product();
        product.setName(productRequest.name);
        product.setPrice(productRequest.price);
        product.setDescription(productRequest.description);
        product.setAvailable(productRequest.available);
        
        // Si viene categoryId, buscar y asignar la categoría
        if (productRequest.categoryId != null) {
            Category category = categoryRepository.findById(productRequest.categoryId)
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + productRequest.categoryId));
            product.setCategory(category);
        } else if (productRequest.category != null && productRequest.category.id != null) {
            // Fallback: si viene el objeto category completo, usar el ID
            Category category = categoryRepository.findById(productRequest.category.id)
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + productRequest.category.id));
            product.setCategory(category);
        }
        
        return productRepository.save(product);
    }

    // 4. ACTUALIZAR PRODUCTO (Solo Admin - RF-24)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody ProductRequest productRequest) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        product.setName(productRequest.name);
        product.setPrice(productRequest.price);
        product.setDescription(productRequest.description);
        product.setAvailable(productRequest.available);
        
        // Actualizar categoría si viene en la solicitud
        if (productRequest.categoryId != null) {
            Category category = categoryRepository.findById(productRequest.categoryId)
                    .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + productRequest.categoryId));
            product.setCategory(category);
        }

        final Product updatedProduct = productRepository.save(product);
        return ResponseEntity.ok(updatedProduct);
    }

    // 5. ELIMINAR PRODUCTO (Solo Admin - RF-24)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        // Remove dependent records before deleting the product to satisfy FK constraints
        deliveryOrderItemRepository.deleteByProduct(product);
        productRepository.deleteIngredientsByProductId(id);
        productRepository.delete(product);
        return ResponseEntity.ok().body("Producto eliminado exitosamente.");
    }

    // 6. ELIMINAR TODOS LOS PRODUCTOS (Solo Admin)
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAllProducts() {
        // Clear dependent tables first to avoid FK violations
        deliveryOrderItemRepository.deleteAll();
        productRepository.deleteAllProductIngredients();
        productRepository.deleteAll();
        return ResponseEntity.ok().body("Todos los productos eliminados exitosamente.");
    }

    // DTO para recibir productos con categoryId
    public static class ProductRequest {
        public String name;
        public Double price;
        public String description;
        public boolean available;
        public Long categoryId;
        public CategoryDTO category;

        public static class CategoryDTO {
            public Long id;
            public String name;
            public String description;
        }
    }
}