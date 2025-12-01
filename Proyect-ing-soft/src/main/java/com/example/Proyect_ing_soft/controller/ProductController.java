package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.Product;
import com.example.Proyect_ing_soft.repository.ProductRepository;
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
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    // 4. ACTUALIZAR PRODUCTO (Solo Admin - RF-24)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        product.setName(productDetails.getName());
        product.setPrice(productDetails.getPrice());
        product.setDescription(productDetails.getDescription());
        product.setAvailable(productDetails.isAvailable());
        // Nota: Aquí podrías actualizar la categoría también si envías el objeto completo

        final Product updatedProduct = productRepository.save(product);
        return ResponseEntity.ok(updatedProduct);
    }

    // 5. ELIMINAR PRODUCTO (Solo Admin - RF-24)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + id));

        productRepository.delete(product);
        return ResponseEntity.ok().body("Producto eliminado exitosamente.");
    }
}