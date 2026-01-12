package com.example.Proyect_ing_soft.config;

import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Normalizes delivery_orders.status rows that contain unexpected values so schema updates do not fail.
 */
@Component
public class DeliveryStatusSanitizer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DeliveryStatusSanitizer.class);

    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "PENDING",
            "PREPARING",
            "READY",
            "DISPATCHED",
            "DELIVERED",
            "CANCELLED");

    private final JdbcTemplate jdbcTemplate;

    public DeliveryStatusSanitizer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'delivery_orders'",
                    Integer.class);
            if (tableExists == null || tableExists == 0) {
                return; // Table not present yet; nothing to sanitize.
            }

            int corrected = 0;
            for (Map<String, Object> row : jdbcTemplate.queryForList("SELECT id, status FROM delivery_orders")) {
                Object statusObj = row.get("status");
                if (statusObj == null) {
                    continue;
                }
                String status = statusObj.toString().trim();
                if (!ALLOWED_STATUSES.contains(status)) {
                    jdbcTemplate.update("UPDATE delivery_orders SET status = ? WHERE id = ?", "PENDING", row.get("id"));
                    corrected++;
                }
            }

            if (corrected > 0) {
                log.info("Normalized {} delivery_orders.status rows to PENDING to match enum", corrected);
            }
        } catch (Exception ex) {
            log.warn("Delivery status sanitization skipped: {}", ex.getMessage());
        }
    }
}