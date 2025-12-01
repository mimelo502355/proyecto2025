package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.Role;
import com.example.Proyect_ing_soft.model.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}