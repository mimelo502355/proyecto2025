package com.example.Proyect_ing_soft.service;

import com.example.Proyect_ing_soft.model.DeliveryOrder;
import com.example.Proyect_ing_soft.repository.DeliveryOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DeliveryService {

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    public DeliveryOrder createOrder(DeliveryOrder order) {
        return deliveryOrderRepository.save(order);
    }

    public List<DeliveryOrder> getAllOrders() {
        return deliveryOrderRepository.findAll();
    }

    public DeliveryOrder updateStatus(Long id, String status) {
        DeliveryOrder order = deliveryOrderRepository.findById(id).orElseThrow();
        order.setStatus(status);
        if ("PREPARING".equals(status) && order.getPreparationTime() == null) {
            order.setPreparationTime(java.time.LocalDateTime.now());
        }
        return deliveryOrderRepository.save(order);
    }
}
