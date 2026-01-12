package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.RestaurantTable; // Asegúrate que tu modelo se llame así
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TableRepository extends JpaRepository<RestaurantTable, Long> {
    // Spring Data JPA crea los métodos automáticamente
    java.util.Optional<RestaurantTable> findByName(String name);
}