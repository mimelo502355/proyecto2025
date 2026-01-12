package com.example.Proyect_ing_soft.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.Proyect_ing_soft.model.DeliveryOrderItem;
import com.example.Proyect_ing_soft.model.Product;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface DeliveryOrderItemRepository extends JpaRepository<DeliveryOrderItem, Long> {
	@Modifying
	@Transactional
	void deleteByProduct(Product product);
}
