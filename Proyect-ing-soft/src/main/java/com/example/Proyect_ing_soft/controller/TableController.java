package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.*;
import com.example.Proyect_ing_soft.repository.*;
import com.example.Proyect_ing_soft.service.DeliveryOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(TableController.class);

    @Autowired
    TableRepository tableRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    OrderItemRepository orderItemRepository;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    DeliveryOrderService deliveryOrderService;

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
        try {
            logger.info("🔵 confirmTable llamado - mesa ID: {}", id);
            logger.info("📥 Items recibidos: {}", items);
            
            // Validar que hay items PRIMERO
            if (items == null || items.isEmpty()) {
                logger.warn("⚠️ Intento de confirmar pedido sin items para mesa {}", id);
                return ResponseEntity.badRequest().body("Debe agregar al menos un producto");
            }
            
            logger.info("🔵 confirmTable llamado para mesa ID: {}, items: {}", id, items.size());
            
            RestaurantTable table = tableRepository.findById(id)
                    .orElseThrow(() -> {
                        logger.error("❌ Mesa no encontrada: {}", id);
                        return new RuntimeException("Mesa no encontrada");
                    });

        // 1. Crear el Pedido
        RestaurantOrder order = new RestaurantOrder(table.getId(), table.getName());
        order = orderRepository.save(order);
        logger.info("✅ Pedido creado: {}", order.getId());

        double total = 0;
        for (OrderItemRequest itemReq : items) {
            logger.debug("📦 Procesando item: productId={}, quantity={}", itemReq.productId(), itemReq.quantity());
            
            Product product = productRepository.findById(itemReq.productId())
                    .orElseThrow(() -> {
                        logger.error("❌ Producto no encontrado: {}", itemReq.productId());
                        return new RuntimeException("Producto no encontrado: " + itemReq.productId());
                    });

            OrderItem item = new OrderItem(order, product.getId(), product.getName(), itemReq.quantity(),
                    product.getPrice());
            orderItemRepository.save(item);
            total += item.getSubtotal();
            logger.debug("✅ Item guardado: {} x {}", itemReq.quantity(), product.getName());
        }

        order.setTotalAmount(total);
        orderRepository.save(order);
        logger.info("✅ Pedido actualizado con total: {}", total);

        // 2. Actualizar Mesa
        table.setStatus("READY_TO_KITCHEN");
        table.setOccupiedAt(LocalDateTime.now());
        tableRepository.save(table);
        logger.info("✅ Mesa actualizada a READY_TO_KITCHEN");

            return ResponseEntity.ok("Pedido confirmado, tiempo iniciado. Total: " + total);
        } catch (Exception e) {
            logger.error("❌ Error al confirmar pedido para mesa {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Error al confirmar pedido: " + e.getMessage());
        }
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

        // Sincronizar estado con delivery si aplica
        extractDeliveryId(table.getName()).ifPresent(deliveryId -> {
            try {
                deliveryOrderService.updateDeliveryOrderStatus(deliveryId, "PREPARING");
            } catch (Exception ignored) {
                // evitar romper flujo de cocina
            }
        });
        return ResponseEntity.ok("Preparación iniciada");
    }

    @PostMapping("/{id}/ready")
    @PreAuthorize("hasRole('COCINA') or hasRole('ADMIN')")
    public ResponseEntity<?> setReady(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("READY");
        tableRepository.save(table);

        // Sincronizar estado con delivery si aplica
        extractDeliveryId(table.getName()).ifPresent(deliveryId -> {
            try {
                deliveryOrderService.updateDeliveryOrderStatus(deliveryId, "READY");
            } catch (Exception ignored) {
                // evitar romper flujo de cocina
            }
        });
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

    @PostMapping("/{id}/cancel-order")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN')")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        // Solo permite cancelar si la cocina NO ha empezado a preparar
        if ("PREPARING".equals(table.getStatus()) || "READY".equals(table.getStatus()) || 
            "SERVING".equals(table.getStatus()) || "WAITING_PAYMENT".equals(table.getStatus())) {
            return ResponseEntity.badRequest().body("No se puede cancelar un pedido en preparación o servido");
        }

        // Eliminar la orden asociada (buscar OPEN o WAITING_PAYMENT)
        java.util.Optional<RestaurantOrder> order = orderRepository.findByTableIdAndStatus(id, "OPEN");
        if (order.isEmpty()) {
            order = orderRepository.findByTableIdAndStatus(id, "WAITING_PAYMENT");
        }
        if (order.isPresent()) {
            orderRepository.delete(order.get());
        }

        // Liberar la mesa
        table.setStatus("AVAILABLE");
        table.setOccupiedAt(null);
        table.setPreparationAt(null);
        tableRepository.save(table);

        return ResponseEntity.ok("Pedido cancelado y mesa liberada");
    }

    private java.util.Optional<Long> extractDeliveryId(String tableName) {
        if (tableName == null) return java.util.Optional.empty();
        String prefix = "DELIVERY #";
        if (!tableName.startsWith(prefix)) return java.util.Optional.empty();
        try {
            return java.util.Optional.of(Long.parseLong(tableName.substring(prefix.length())));
        } catch (NumberFormatException e) {
            return java.util.Optional.empty();
        }
    }

    @PostMapping("/{id}/request-bill")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> requestBill(@PathVariable Long id) {
        RestaurantTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mesa no encontrada"));

        table.setStatus("WAITING_PAYMENT");
        tableRepository.save(table);

        Optional<RestaurantOrder> order = orderRepository.findByTableIdAndStatus(id, "OPEN");
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
                "WAITING_PAYMENT");
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
        try {
            Optional<RestaurantOrder> order = orderRepository.findByTableIdAndStatus(id, "OPEN");
            if (order.isEmpty()) {
                order = orderRepository.findByTableIdAndStatus(id, "WAITING_PAYMENT");
            }

            return order.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error obteniendo detalles de orden para mesa {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("Error al obtener detalles de la orden: " + e.getMessage());
        }
    }

    @GetMapping("/orders/completed")
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('COCINA')")
    public ResponseEntity<?> getCompletedOrders() {
        try {
            List<RestaurantOrder> completedOrders = orderRepository.findByStatusWithItems(RestaurantOrder.OrderStatus.PAID);
            return ResponseEntity.ok(completedOrders);
        } catch (Exception e) {
            logger.error("Error obteniendo órdenes completadas: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error al obtener órdenes completadas: " + e.getMessage());
        }
    }
}
