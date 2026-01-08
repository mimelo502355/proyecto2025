package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.Insumo;
import com.example.Proyect_ing_soft.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public List<Insumo> getAllInsumos() {
        return inventoryService.getAllInsumos();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Insumo> updateInsumo(@PathVariable Long id, @RequestBody Insumo insumo) {
        return ResponseEntity.ok(inventoryService.updateInsumo(id, insumo));
    }
}
