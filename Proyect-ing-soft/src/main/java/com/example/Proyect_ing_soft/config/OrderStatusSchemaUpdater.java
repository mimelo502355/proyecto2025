package com.example.Proyect_ing_soft.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures orders.status can store any enum value by converting the column to VARCHAR.
 */
@Component
public class OrderStatusSchemaUpdater implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OrderStatusSchemaUpdater.class);

    private final JdbcTemplate jdbcTemplate;

    public OrderStatusSchemaUpdater(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            Integer tableExists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'orders'",
                    Integer.class);
            if (tableExists == null || tableExists == 0) {
                return;
            }

            String columnType = jdbcTemplate.queryForObject(
                    "SELECT COLUMN_TYPE FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'status'",
                    String.class);

            if (columnType != null && columnType.toLowerCase().startsWith("enum")) {
                jdbcTemplate.execute("ALTER TABLE orders MODIFY status VARCHAR(32) NOT NULL");
                log.info("orders.status converted from ENUM to VARCHAR(32)");
            }
        } catch (Exception ex) {
            log.warn("orders.status schema check failed: {}", ex.getMessage());
        }
    }
}