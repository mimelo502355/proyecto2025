package com.example.Proyect_ing_soft.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.Proyect_ing_soft.payload.request.CreateDeliveryOrderRequest;
import com.example.Proyect_ing_soft.payload.request.SendDeliveryToKitchenRequest;
import com.example.Proyect_ing_soft.payload.response.DeliveryOrderResponse;
import com.example.Proyect_ing_soft.service.DeliveryOrderService;
import jakarta.validation.Valid;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/delivery")
public class DeliveryOrderController {
    
    private final DeliveryOrderService deliveryOrderService;
    
    public DeliveryOrderController(DeliveryOrderService deliveryOrderService) {
        this.deliveryOrderService = deliveryOrderService;
    }
    
    @PostMapping("/create")
    public ResponseEntity<DeliveryOrderResponse> createDeliveryOrder(
            @Valid @RequestBody CreateDeliveryOrderRequest request) {
        DeliveryOrderResponse response = deliveryOrderService.createDeliveryOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PostMapping("/{id}/send-to-kitchen")
    public ResponseEntity<String> sendDeliveryToKitchen(
            @PathVariable Long id,
            @RequestBody SendDeliveryToKitchenRequest request) {
        try {
            String message = deliveryOrderService.sendDeliveryToKitchen(id, request);
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DeliveryOrderResponse> getDeliveryOrder(@PathVariable Long id) {
        DeliveryOrderResponse response = deliveryOrderService.getDeliveryOrderById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<DeliveryOrderResponse>> getAllDeliveryOrders() {
        List<DeliveryOrderResponse> responses = deliveryOrderService.getAllDeliveryOrders();
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<DeliveryOrderResponse>> getDeliveryOrdersByStatus(
            @PathVariable String status) {
        List<DeliveryOrderResponse> responses = deliveryOrderService.getDeliveryOrdersByStatus(status);
        return ResponseEntity.ok(responses);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<DeliveryOrderResponse> updateDeliveryOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        DeliveryOrderResponse response = deliveryOrderService.updateDeliveryOrderStatus(id, status);
        return ResponseEntity.ok(response);
    }
}
