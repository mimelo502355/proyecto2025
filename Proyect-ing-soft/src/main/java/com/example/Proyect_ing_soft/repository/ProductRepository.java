package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
}