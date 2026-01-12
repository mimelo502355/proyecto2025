package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.RestaurantOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface OrderRepository extends JpaRepository<RestaurantOrder, Long> {
    
    @Query(value = "SELECT * FROM orders WHERE table_id = :tableId AND status = :status ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<RestaurantOrder> findByTableIdAndStatus(@Param("tableId") Long tableId, @Param("status") String status);

    List<RestaurantOrder> findByStatus(RestaurantOrder.OrderStatus status);
    
    @Query("SELECT DISTINCT o FROM RestaurantOrder o LEFT JOIN FETCH o.items WHERE o.status = :status")
    List<RestaurantOrder> findByStatusWithItems(@Param("status") RestaurantOrder.OrderStatus status);
}
