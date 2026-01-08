package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.DeliveryOrder;
import com.example.Proyect_ing_soft.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/delivery")
public class DeliveryController {

    @Autowired
    private DeliveryService deliveryService;

    @PostMapping
    @PreAuthorize("hasRole('MOZO') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<DeliveryOrder> createOrder(@RequestBody DeliveryOrder order) {
        return ResponseEntity.ok(deliveryService.createOrder(order));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('COCINA')")
    public List<DeliveryOrder> getAllOrders() {
        return deliveryService.getAllOrders();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN') or hasRole('COCINA')")
    public ResponseEntity<DeliveryOrder> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(deliveryService.updateStatus(id, status));
    }
}
