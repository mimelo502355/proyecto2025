package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, Long> {
}
