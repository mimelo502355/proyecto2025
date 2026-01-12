package com.example.Proyect_ing_soft.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.Proyect_ing_soft.model.DeliveryOrder;
import java.util.List;

@Repository
public interface DeliveryOrderRepository extends JpaRepository<DeliveryOrder, Long> {
    List<DeliveryOrder> findByStatus(DeliveryOrder.DeliveryStatus status);
    List<DeliveryOrder> findAllByOrderByCreatedAtDesc();
}
