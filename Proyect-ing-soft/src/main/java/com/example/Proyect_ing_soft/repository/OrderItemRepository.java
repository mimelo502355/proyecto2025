package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
