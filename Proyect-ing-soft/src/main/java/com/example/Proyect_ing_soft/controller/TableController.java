package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.*;
import com.example.Proyect_ing_soft.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/tables")
public class TableController {

    @Autowired
    TableRepository tableRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    OrderItemRepository orderItemRepository;

    @Autowired
    ProductRepository productRepository;

    @GetMapping
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public List<RestaurantTable> getAllTables() {
        return tableRepository.findAll();
    }

    @PostMapping("/{id}/occupy")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> occupyTable(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("OCCUPIED"); // Estado inicial de ocupación
        table.setOccupiedAt(null); // No iniciamos el tiempo aún

        tableRepository.save(table);
        return ResponseEntity.ok("Mesa abierta exitosamente");
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> confirmTable(@PathVariable Long id, @RequestBody List<OrderItemRequest> items) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        // 1. Crear el Pedido
        RestaurantOrder order = new RestaurantOrder(table.getId(), table.getName());
        order = orderRepository.save(order);

        double total = 0;
        for (OrderItemRequest itemReq : items) {
            Product product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            OrderItem item = new OrderItem(order, product.getId(), product.getName(), itemReq.quantity(),
                    product.getPrice());
            orderItemRepository.save(item);
            total += item.getSubtotal();
        }

        order.setTotalAmount(total);
        orderRepository.save(order);

        // 2. Actualizar Mesa
        table.setStatus("READY_TO_KITCHEN");
        table.setOccupiedAt(LocalDateTime.now());
        tableRepository.save(table);

        return ResponseEntity.ok("Pedido confirmado, tiempo iniciado. Total: " + total);
    }

    // DTO para el detalle del pedido
    public record OrderItemRequest(Long productId, Integer quantity) {
    }

    @PostMapping("/{id}/send-to-kitchen")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> sendToKitchen(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("WAITING_KITCHEN");

        tableRepository.save(table);
        return ResponseEntity.ok("Pedido enviado a cocina");
    }

    @PostMapping("/{id}/start-preparation")
    @PreAuthorize("hasRole('COCINA') or hasRole('ADMIN')")
    public ResponseEntity<?> startPreparation(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("PREPARING");
        table.setPreparationAt(LocalDateTime.now());
        tableRepository.save(table);
        return ResponseEntity.ok("Preparación iniciada");
    }

    @PostMapping("/{id}/ready")
    @PreAuthorize("hasRole('COCINA') or hasRole('ADMIN')")
    public ResponseEntity<?> setReady(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("READY");
        tableRepository.save(table);
        return ResponseEntity.ok("Pedido listo");
    }

    @PostMapping("/{id}/serve")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> serveTable(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("SERVING");
        tableRepository.save(table);
        return ResponseEntity.ok("Pedido servido");
    }

    @PostMapping("/{id}/free")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> freeTable(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("AVAILABLE");
        table.setOccupiedAt(null);
        table.setPreparationAt(null);

        tableRepository.save(table);
        return ResponseEntity.ok("Mesa liberada exitosamente");
    }

    @PostMapping("/{id}/request-bill")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> requestBill(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("WAITING_PAYMENT");
        tableRepository.save(table);

        Optional<RestaurantOrder> order = orderRepository.findByTableIdAndStatus(id, RestaurantOrder.OrderStatus.OPEN);
        order.ifPresent(o -> {
            o.setStatus(RestaurantOrder.OrderStatus.WAITING_PAYMENT);
            orderRepository.save(o);
        });

        return ResponseEntity.ok("Cuenta solicitada. Estado: Por Pagar");
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> payTable(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        // Marcar orden como pagada
        Optional<RestaurantOrder> order = orderRepository.findByTableIdAndStatus(id,
                RestaurantOrder.OrderStatus.WAITING_PAYMENT);
        if (order.isPresent()) {
            RestaurantOrder o = order.get();
            o.setStatus(RestaurantOrder.OrderStatus.PAID);
            o.setPaidAt(LocalDateTime.now());
            orderRepository.save(o);
        }

        // Liberar mesa
        table.setStatus("AVAILABLE");
        table.setOccupiedAt(null);
        table.setPreparationAt(null);
        tableRepository.save(table);

        return ResponseEntity.ok("Pago confirmado y mesa liberada");
    }

    @GetMapping("/{id}/order-details")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> getOrderDetails(@PathVariable Long id) {
        Optional<RestaurantOrder> order = orderRepository.findByTableIdAndStatus(id, RestaurantOrder.OrderStatus.OPEN);
        if (order.isEmpty()) {
            order = orderRepository.findByTableIdAndStatus(id, RestaurantOrder.OrderStatus.WAITING_PAYMENT);
        }

        return order.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
