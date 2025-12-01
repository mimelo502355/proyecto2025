package com.example.Proyect_ing_soft.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Double price;
    private String description;
    private boolean available;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;
}