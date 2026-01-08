package com.example.Proyect_ing_soft.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_ingredients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @Column(name = "quantity_needed", nullable = false)
    private Double quantityNeeded;
}
