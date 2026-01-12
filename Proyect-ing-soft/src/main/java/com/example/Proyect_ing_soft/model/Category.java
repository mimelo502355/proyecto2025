package com.example.Proyect_ing_soft.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    // Constructor que usa el DataLoader
    public Category(String name) {
        this.name = name;
        this.description = "";
    }
    
    public Category(String name, String description) {
        this.name = name;
        this.description = description;
    }
}