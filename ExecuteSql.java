import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class ExecuteSql {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/picantedb?characterEncoding=utf8mb4";
        String user = "root";
        String password = "";
        
        String[] sqlStatements = {
            "DELETE FROM order_items WHERE order_id IN (SELECT id FROM restaurant_orders WHERE table_id IN (1, 2, 3, 4, 5))",
            "DELETE FROM restaurant_orders WHERE table_id IN (1, 2, 3, 4, 5)",
            "DELETE FROM restaurant_tables WHERE id IN (1, 2, 3, 4, 5)",
            "INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, created_at, updated_at) VALUES (1, 'S1', 4, 'WAITING_KITCHEN', NOW(), NOW(), NOW())",
            "INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at) VALUES (1, 1, 'S1', 'OPEN', 0, DATE_SUB(NOW(), INTERVAL 5 MINUTE), NOW())",
            "SET @order_id_1 = LAST_INSERT_ID()",
            "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at) VALUES (@order_id_1, 1, 'Combo1', 1, 14.00, 14.00, NOW(), NOW()), (@order_id_1, 5, 'Combo2', 1, 25.00, 25.00, NOW(), NOW())",
            "UPDATE restaurant_orders SET total_amount = 39.00 WHERE id = @order_id_1",
            "INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, preparation_at, created_at, updated_at) VALUES (2, 'S2', 4, 'PREPARING', NOW(), DATE_SUB(NOW(), INTERVAL 3 MINUTE), NOW(), NOW())",
            "INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at) VALUES (2, 2, 'S2', 'OPEN', 0, DATE_SUB(NOW(), INTERVAL 8 MINUTE), NOW())",
            "SET @order_id_2 = LAST_INSERT_ID()",
            "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at) VALUES (@order_id_2, 2, 'Combo3', 1, 17.00, 17.00, NOW(), NOW()), (@order_id_2, 6, 'Combo4', 1, 18.00, 18.00, NOW(), NOW()), (@order_id_2, 15, 'Beverage', 2, 5.00, 10.00, NOW(), NOW())",
            "UPDATE restaurant_orders SET total_amount = 45.00 WHERE id = @order_id_2",
            "INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, preparation_at, created_at, updated_at) VALUES (3, 'S3', 2, 'READY', NOW(), DATE_SUB(NOW(), INTERVAL 10 MINUTE), NOW(), NOW())",
            "INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at) VALUES (3, 3, 'S3', 'OPEN', 0, DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW())",
            "SET @order_id_3 = LAST_INSERT_ID()",
            "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at) VALUES (@order_id_3, 3, 'Combo5', 1, 22.00, 22.00, NOW(), NOW())",
            "UPDATE restaurant_orders SET total_amount = 22.00 WHERE id = @order_id_3",
            "INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, created_at, updated_at) VALUES (4, 'S4', 6, 'WAITING_PAYMENT', NOW(), NOW(), NOW())",
            "INSERT INTO restaurant_orders (table_id, table_number, table_name, status, total_amount, created_at, updated_at) VALUES (4, 4, 'S4', 'WAITING_PAYMENT', 0, DATE_SUB(NOW(), INTERVAL 20 MINUTE), NOW())",
            "SET @order_id_4 = LAST_INSERT_ID()",
            "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at, updated_at) VALUES (@order_id_4, 4, 'Combo6', 2, 25.00, 50.00, NOW(), NOW()), (@order_id_4, 7, 'Combo7', 1, 12.00, 12.00, NOW(), NOW())",
            "UPDATE restaurant_orders SET total_amount = 62.00 WHERE id = @order_id_4",
            "INSERT INTO restaurant_tables (id, name, capacity, status, occupied_at, created_at, updated_at) VALUES (5, 'S5', 4, 'AVAILABLE', NULL, NOW(), NOW())"
        };
        
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection connection = DriverManager.getConnection(url, user, password);
            Statement stmt = connection.createStatement();
            
            for (String statement : sqlStatements) {
                if (!statement.trim().isEmpty()) {
                    try {
                        stmt.execute(statement.trim());
                        System.out.println("OK: " + statement.substring(0, Math.min(50, statement.length())));
                    } catch (Exception e) {
                        System.err.println("Error: " + e.getMessage());
                    }
                }
            }
            
            stmt.close();
            connection.close();
            System.out.println("Test data loaded successfully!");
            
        } catch (Exception e) {
            System.err.println("Connection error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
