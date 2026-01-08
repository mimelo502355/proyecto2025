package com.example.Proyect_ing_soft.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "restaurant_orders")
@Data
@NoArgsConstructor
public class RestaurantOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long tableId;
    private String tableName;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status; // OPEN, WAITING_PAYMENT, PAID

    private Double totalAmount = 0.0;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public enum OrderStatus {
        OPEN, WAITING_PAYMENT, PAID
    }

    public RestaurantOrder(Long tableId, String tableName) {
        this.tableId = tableId;
        this.tableName = tableName;
        this.status = OrderStatus.OPEN;
        this.createdAt = LocalDateTime.now();
    }
}
