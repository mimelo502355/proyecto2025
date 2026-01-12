package com.example.Proyect_ing_soft.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.Proyect_ing_soft.service.DocumentService;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    /**
     * Consultar información de RUC
     * @param ruc Número de RUC a consultar
     * @return Datos de la empresa registrada
     */
    @GetMapping("/consultar-ruc/{ruc}")
    public ResponseEntity<?> consultarRUC(@PathVariable String ruc) {
        try {
            Map<String, Object> response = documentService.consultarRUC(ruc);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of(
                "error", "No se pudo encontrar el RUC",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Consultar información de DNI
     * @param dni Número de DNI a consultar
     * @return Datos personales del titular
     */
    @GetMapping("/consultar-dni/{dni}")
    public ResponseEntity<?> consultarDNI(@PathVariable String dni) {
        try {
            Map<String, Object> response = documentService.consultarDNI(dni);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of(
                "error", "No se pudo encontrar el DNI",
                "message", e.getMessage()
            ));
        }
    }
}
