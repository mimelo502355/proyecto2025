package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.Category;
import com.example.Proyect_ing_soft.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    long countByCategory(Category category);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM product_ingredients WHERE product_id = :productId", nativeQuery = true)
    void deleteIngredientsByProductId(@Param("productId") Long productId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM product_ingredients", nativeQuery = true)
    void deleteAllProductIngredients();
}