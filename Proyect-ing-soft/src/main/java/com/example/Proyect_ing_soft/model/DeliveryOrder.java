package com.example.Proyect_ing_soft.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String phone;

    @Column(length = 50)
    private String status = "PENDING";

    @Column(name = "payment_status", length = 50)
    private String paymentStatus = "PENDING";

    @Column(name = "order_date")
    private LocalDateTime orderDate = LocalDateTime.now();

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "preparation_time")
    private LocalDateTime preparationTime;
}
