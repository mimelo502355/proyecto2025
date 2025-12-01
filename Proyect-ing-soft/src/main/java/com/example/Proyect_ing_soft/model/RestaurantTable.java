package com.example.Proyect_ing_soft.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "restaurant_tables")
@Data
@NoArgsConstructor
public class RestaurantTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private int capacity;
    private String status;

    public RestaurantTable(String name, int capacity, String status) {
        this.name = name;
        this.capacity = capacity;
        this.status = status;
    }
}