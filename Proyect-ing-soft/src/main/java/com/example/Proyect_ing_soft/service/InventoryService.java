package com.example.Proyect_ing_soft.service;

import com.example.Proyect_ing_soft.model.Insumo;
import com.example.Proyect_ing_soft.model.ProductIngredient;
import com.example.Proyect_ing_soft.repository.InsumoRepository;
import com.example.Proyect_ing_soft.repository.ProductIngredientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class InventoryService {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private ProductIngredientRepository productIngredientRepository;

    public void deductStock(Long productId, Integer quantity) {
        List<ProductIngredient> ingredients = productIngredientRepository.findByProductId(productId);
        int qty = (quantity != null) ? quantity : 0;

        for (ProductIngredient ingredient : ingredients) {
            Insumo insumo = ingredient.getInsumo();
            if (insumo == null)
                continue;

            Double needed = (ingredient.getQuantityNeeded() != null) ? ingredient.getQuantityNeeded() : 0.0;
            Double amountToDeduct = needed * qty;

            Double currentStock = (insumo.getStock() != null) ? insumo.getStock() : 0.0;
            insumo.setStock(currentStock - amountToDeduct);
            insumoRepository.save(insumo);

            Double minStock = (insumo.getMinStock() != null) ? insumo.getMinStock() : 0.0;
            if (insumo.getStock() <= minStock) {
                System.out.println("ALERT: Low stock for " + insumo.getName() + ": " + insumo.getStock());
            }
        }
    }

    public List<Insumo> getAllInsumos() {
        return insumoRepository.findAll();
    }

    public Insumo updateInsumo(Long id, Insumo details) {
        Insumo insumo = insumoRepository.findById(id).orElseThrow();
        insumo.setName(details.getName());
        insumo.setStock(details.getStock());
        insumo.setUnit(details.getUnit());
        insumo.setMinStock(details.getMinStock());
        return insumoRepository.save(insumo);
    }
}
