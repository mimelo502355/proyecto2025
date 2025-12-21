package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.RestaurantOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface OrderRepository extends JpaRepository<RestaurantOrder, Long> {
    Optional<RestaurantOrder> findByTableIdAndStatus(Long tableId, RestaurantOrder.OrderStatus status);

    List<RestaurantOrder> findByStatus(RestaurantOrder.OrderStatus status);
}
