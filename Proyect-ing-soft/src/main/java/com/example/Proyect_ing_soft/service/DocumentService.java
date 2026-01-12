package com.example.Proyect_ing_soft.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@Service
public class DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentService.class);
    private static final RestTemplate restTemplate = new RestTemplate();
    private static final String RUC_API_URL = "https://api.apis.net.pe/v1/ruc?numero=";
    private static final String DNI_API_URL = "https://api.decolecta.com/v1/reniec/dni?numero=";
    private static final String DNI_API_TOKEN = "sk_10201.88xaqS7bi1lgop1zJ4C9dwfccFMa7Luj";

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Consulta RUC en la API de apis.net.pe
     * @param ruc Número de RUC a consultar
     * @return Mapa con datos de la empresa
     */
    public Map<String, Object> consultarRUC(String ruc) throws Exception {
        logger.info("Consultando RUC: {}", ruc);

        if (!isValidRUC(ruc)) {
            throw new IllegalArgumentException("RUC inválido: debe tener 11 dígitos");
        }

        try {
            String url = RUC_API_URL + ruc;
            String response = restTemplate.getForObject(url, String.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(response, Map.class);
            
            logger.info("RUC consultado exitosamente: {}", ruc);
            return data;
        } catch (Exception e) {
            logger.error("Error al consultar RUC {}: {}", ruc, e.getMessage());
            throw new Exception("Error consultando RUC: " + e.getMessage());
        }
    }

    /**
     * Consulta DNI en la API de decolecta
     * @param dni Número de DNI a consultar
     * @return Mapa con datos personales
     */
    public Map<String, Object> consultarDNI(String dni) throws Exception {
        logger.info("Consultando DNI: {}", dni);

        if (!isValidDNI(dni)) {
            throw new IllegalArgumentException("DNI inválido: debe tener 8 dígitos");
        }

        try {
            String url = DNI_API_URL + dni;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("Authorization", "Bearer " + DNI_API_TOKEN);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(response.getBody(), Map.class);

            Map<String, Object> formatted = Map.of(
                "nombres", data.getOrDefault("first_name", ""),
                "apellidoPaterno", data.getOrDefault("first_last_name", ""),
                "apellidoMaterno", data.getOrDefault("second_last_name", "")
            );

            logger.info("DNI consultado exitosamente: {}", dni);
            return formatted;
        } catch (HttpClientErrorException.NotFound e) {
            logger.warn("DNI no encontrado {}: {}", dni, e.getMessage());
            throw new Exception("DNI no encontrado");
        } catch (Exception e) {
            logger.error("Error al consultar DNI {}: {}", dni, e.getMessage());
            throw new Exception("Error consultando DNI: " + e.getMessage());
        }
    }

    /**
     * Valida que el RUC tenga el formato correcto
     */
    private boolean isValidRUC(String ruc) {
        return ruc != null && ruc.matches("\\d{11}");
    }

    /**
     * Valida que el DNI tenga el formato correcto
     */
    private boolean isValidDNI(String dni) {
        return dni != null && dni.matches("\\d{8}");
    }
}
