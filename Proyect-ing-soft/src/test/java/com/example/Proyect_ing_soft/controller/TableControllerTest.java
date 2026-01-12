package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.*;
import com.example.Proyect_ing_soft.repository.*;
import com.example.Proyect_ing_soft.service.DeliveryOrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de Tests de Caja Blanca para TableController
 * Cobertura: 100% de caminos de ejecución, endpoints, condicionales y excepciones
 */
@ExtendWith(MockitoExtension.class)
class TableControllerTest {

    @Mock
    private TableRepository tableRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private DeliveryOrderService deliveryOrderService;

    @InjectMocks
    private TableController tableController;

    private RestaurantTable testTable;
    private RestaurantOrder testOrder;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testTable = new RestaurantTable();
        testTable.setId(1L);
        testTable.setName("Mesa 1");
        testTable.setCapacity(4);
        testTable.setStatus("AVAILABLE");

        testOrder = new RestaurantOrder();
        testOrder.setId(1L);
        testOrder.setTableId(1L);
        testOrder.setTableName("Mesa 1");
        testOrder.setStatus(RestaurantOrder.OrderStatus.PENDING);
        testOrder.setTotalAmount(100.0);

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("Pizza");
        testProduct.setPrice(25.0);
    }

    // ============================================================
    // TESTS PARA getAllTables()
    // ============================================================
    @Nested
    @DisplayName("Tests para getAllTables()")
    class GetAllTablesTests {

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay mesas")
        void getAllTables_ReturnsEmptyList_WhenNoTables() {
            when(tableRepository.findAll()).thenReturn(Collections.emptyList());

            List<RestaurantTable> result = tableController.getAllTables();

            assertTrue(result.isEmpty());
            verify(tableRepository).findAll();
        }

        @Test
        @DisplayName("Debe retornar todas las mesas")
        void getAllTables_ReturnsAllTables() {
            RestaurantTable table2 = new RestaurantTable();
            table2.setId(2L);
            table2.setName("Mesa 2");

            when(tableRepository.findAll()).thenReturn(Arrays.asList(testTable, table2));

            List<RestaurantTable> result = tableController.getAllTables();

            assertEquals(2, result.size());
        }
    }

    // ============================================================
    // TESTS PARA occupyTable()
    // ============================================================
    @Nested
    @DisplayName("Tests para occupyTable()")
    class OccupyTableTests {

        @Test
        @DisplayName("Debe ocupar mesa exitosamente")
        void occupyTable_Success() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.occupyTable(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Mesa abierta exitosamente", result.getBody());
            verify(tableRepository).save(argThat(table -> 
                "OCCUPIED".equals(table.getStatus()) && table.getOccupiedAt() == null));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando mesa no existe")
        void occupyTable_ThrowsException_WhenTableNotFound() {
            when(tableRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> tableController.occupyTable(999L));

            assertEquals("Mesa no encontrada", exception.getMessage());
        }
    }

    // ============================================================
    // TESTS PARA confirmTable()
    // ============================================================
    @Nested
    @DisplayName("Tests para confirmTable()")
    class ConfirmTableTests {

        @Test
        @DisplayName("Debe confirmar mesa con items exitosamente")
        void confirmTable_Success_WithItems() {
            List<TableController.OrderItemRequest> items = Arrays.asList(
                    new TableController.OrderItemRequest(1L, 2)
            );

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.save(any(RestaurantOrder.class))).thenAnswer(i -> {
                RestaurantOrder o = i.getArgument(0);
                o.setId(1L);
                return o;
            });
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(i -> i.getArgument(0));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.confirmTable(1L, items);

            assertEquals(200, result.getStatusCode().value());
            assertTrue(result.getBody().toString().contains("Pedido confirmado"));
            verify(orderRepository, times(2)).save(any(RestaurantOrder.class));
        }

        @Test
        @DisplayName("Debe calcular total correctamente")
        void confirmTable_CalculatesTotalCorrectly() {
            Product product2 = new Product();
            product2.setId(2L);
            product2.setName("Hamburguesa");
            product2.setPrice(15.0);

            List<TableController.OrderItemRequest> items = Arrays.asList(
                    new TableController.OrderItemRequest(1L, 2),  // 25 * 2 = 50
                    new TableController.OrderItemRequest(2L, 3)   // 15 * 3 = 45
            );

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.save(any(RestaurantOrder.class))).thenAnswer(i -> {
                RestaurantOrder o = i.getArgument(0);
                o.setId(1L);
                return o;
            });
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(productRepository.findById(2L)).thenReturn(Optional.of(product2));
            when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(i -> i.getArgument(0));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.confirmTable(1L, items);

            assertTrue(result.getBody().toString().contains("95.0"));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando mesa no existe")
        void confirmTable_ThrowsException_WhenTableNotFound() {
            when(tableRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> tableController.confirmTable(999L, Collections.emptyList()));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando producto no existe")
        void confirmTable_ThrowsException_WhenProductNotFound() {
            List<TableController.OrderItemRequest> items = Arrays.asList(
                    new TableController.OrderItemRequest(999L, 1)
            );

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.save(any(RestaurantOrder.class))).thenAnswer(i -> {
                RestaurantOrder o = i.getArgument(0);
                o.setId(1L);
                return o;
            });
            when(productRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> tableController.confirmTable(1L, items));
        }

        @Test
        @DisplayName("Debe actualizar estado de mesa a READY_TO_KITCHEN")
        void confirmTable_UpdatesTableStatus() {
            List<TableController.OrderItemRequest> items = Arrays.asList(
                    new TableController.OrderItemRequest(1L, 1)
            );

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.save(any(RestaurantOrder.class))).thenAnswer(i -> {
                RestaurantOrder o = i.getArgument(0);
                o.setId(1L);
                return o;
            });
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(i -> i.getArgument(0));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.confirmTable(1L, items);

            verify(tableRepository).save(argThat(table -> 
                "READY_TO_KITCHEN".equals(table.getStatus()) && table.getOccupiedAt() != null));
        }
    }

    // ============================================================
    // TESTS PARA sendToKitchen()
    // ============================================================
    @Nested
    @DisplayName("Tests para sendToKitchen()")
    class SendToKitchenTests {

        @Test
        @DisplayName("Debe enviar a cocina exitosamente")
        void sendToKitchen_Success() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.sendToKitchen(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Pedido enviado a cocina", result.getBody());
            verify(tableRepository).save(argThat(table -> "WAITING_KITCHEN".equals(table.getStatus())));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando mesa no existe")
        void sendToKitchen_ThrowsException_WhenTableNotFound() {
            when(tableRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> tableController.sendToKitchen(999L));
        }
    }

    // ============================================================
    // TESTS PARA startPreparation()
    // ============================================================
    @Nested
    @DisplayName("Tests para startPreparation()")
    class StartPreparationTests {

        @Test
        @DisplayName("Debe iniciar preparación exitosamente")
        void startPreparation_Success() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.startPreparation(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Preparación iniciada", result.getBody());
            verify(tableRepository).save(argThat(table -> 
                "PREPARING".equals(table.getStatus()) && table.getPreparationAt() != null));
        }

        @Test
        @DisplayName("Debe sincronizar estado con delivery cuando es mesa de delivery")
        void startPreparation_SyncsDeliveryStatus() {
            testTable.setName("DELIVERY #5");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.startPreparation(1L);

            verify(deliveryOrderService).updateDeliveryOrderStatus(5L, "PREPARING");
        }

        @Test
        @DisplayName("No debe fallar cuando sincronización con delivery falla")
        void startPreparation_DoesNotFail_WhenDeliverySyncFails() {
            testTable.setName("DELIVERY #5");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            doThrow(new RuntimeException("Error de delivery")).when(deliveryOrderService)
                    .updateDeliveryOrderStatus(anyLong(), anyString());

            ResponseEntity<?> result = tableController.startPreparation(1L);

            assertEquals(200, result.getStatusCode().value());
        }

        @Test
        @DisplayName("No debe sincronizar cuando no es mesa de delivery")
        void startPreparation_DoesNotSyncDelivery_WhenNotDeliveryTable() {
            testTable.setName("Mesa 1");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.startPreparation(1L);

            verify(deliveryOrderService, never()).updateDeliveryOrderStatus(anyLong(), anyString());
        }
    }

    // ============================================================
    // TESTS PARA setReady()
    // ============================================================
    @Nested
    @DisplayName("Tests para setReady()")
    class SetReadyTests {

        @Test
        @DisplayName("Debe marcar como listo exitosamente")
        void setReady_Success() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.setReady(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Pedido listo", result.getBody());
            verify(tableRepository).save(argThat(table -> "READY".equals(table.getStatus())));
        }

        @Test
        @DisplayName("Debe sincronizar estado con delivery")
        void setReady_SyncsDeliveryStatus() {
            testTable.setName("DELIVERY #10");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.setReady(1L);

            verify(deliveryOrderService).updateDeliveryOrderStatus(10L, "READY");
        }

        @Test
        @DisplayName("No debe fallar cuando sincronización falla")
        void setReady_DoesNotFail_WhenDeliverySyncFails() {
            testTable.setName("DELIVERY #10");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            doThrow(new RuntimeException("Error")).when(deliveryOrderService)
                    .updateDeliveryOrderStatus(anyLong(), anyString());

            ResponseEntity<?> result = tableController.setReady(1L);

            assertEquals(200, result.getStatusCode().value());
        }
    }

    // ============================================================
    // TESTS PARA serveTable()
    // ============================================================
    @Nested
    @DisplayName("Tests para serveTable()")
    class ServeTableTests {

        @Test
        @DisplayName("Debe servir mesa exitosamente")
        void serveTable_Success() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.serveTable(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Pedido servido", result.getBody());
            verify(tableRepository).save(argThat(table -> "SERVING".equals(table.getStatus())));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando mesa no existe")
        void serveTable_ThrowsException_WhenTableNotFound() {
            when(tableRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> tableController.serveTable(999L));
        }
    }

    // ============================================================
    // TESTS PARA freeTable()
    // ============================================================
    @Nested
    @DisplayName("Tests para freeTable()")
    class FreeTableTests {

        @Test
        @DisplayName("Debe liberar mesa exitosamente")
        void freeTable_Success() {
            testTable.setOccupiedAt(LocalDateTime.now());
            testTable.setPreparationAt(LocalDateTime.now());

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.freeTable(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Mesa liberada exitosamente", result.getBody());
            verify(tableRepository).save(argThat(table -> 
                "AVAILABLE".equals(table.getStatus()) && 
                table.getOccupiedAt() == null && 
                table.getPreparationAt() == null));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando mesa no existe")
        void freeTable_ThrowsException_WhenTableNotFound() {
            when(tableRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> tableController.freeTable(999L));
        }
    }

    // ============================================================
    // TESTS PARA requestBill()
    // ============================================================
    @Nested
    @DisplayName("Tests para requestBill()")
    class RequestBillTests {

        @Test
        @DisplayName("Debe solicitar cuenta exitosamente con orden existente")
        void requestBill_Success_WithExistingOrder() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any(RestaurantOrder.class))).thenReturn(testOrder);

            ResponseEntity<?> result = tableController.requestBill(1L);

            assertEquals(200, result.getStatusCode().value());
            assertTrue(result.getBody().toString().contains("Cuenta solicitada"));
            verify(orderRepository).save(argThat(order -> 
                RestaurantOrder.OrderStatus.WAITING_PAYMENT.equals(order.getStatus())));
        }

        @Test
        @DisplayName("Debe solicitar cuenta sin orden existente")
        void requestBill_Success_WithoutExistingOrder() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.empty());

            ResponseEntity<?> result = tableController.requestBill(1L);

            assertEquals(200, result.getStatusCode().value());
            verify(orderRepository, never()).save(any(RestaurantOrder.class));
        }

        @Test
        @DisplayName("Debe actualizar estado de mesa a WAITING_PAYMENT")
        void requestBill_UpdatesTableStatus() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(orderRepository.findByTableIdAndStatus(anyLong(), anyString())).thenReturn(Optional.empty());

            tableController.requestBill(1L);

            verify(tableRepository).save(argThat(table -> "WAITING_PAYMENT".equals(table.getStatus())));
        }
    }

    // ============================================================
    // TESTS PARA payTable()
    // ============================================================
    @Nested
    @DisplayName("Tests para payTable()")
    class PayTableTests {

        @Test
        @DisplayName("Debe pagar mesa exitosamente con orden existente")
        void payTable_Success_WithExistingOrder() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(orderRepository.findByTableIdAndStatus(1L, "WAITING_PAYMENT")).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any(RestaurantOrder.class))).thenReturn(testOrder);

            ResponseEntity<?> result = tableController.payTable(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Pago confirmado y mesa liberada", result.getBody());
            verify(orderRepository).save(argThat(order -> 
                RestaurantOrder.OrderStatus.PAID.equals(order.getStatus()) && order.getPaidAt() != null));
        }

        @Test
        @DisplayName("Debe pagar mesa sin orden existente")
        void payTable_Success_WithoutExistingOrder() {
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(orderRepository.findByTableIdAndStatus(1L, "WAITING_PAYMENT")).thenReturn(Optional.empty());

            ResponseEntity<?> result = tableController.payTable(1L);

            assertEquals(200, result.getStatusCode().value());
            verify(orderRepository, never()).save(any(RestaurantOrder.class));
        }

        @Test
        @DisplayName("Debe liberar mesa y resetear timestamps")
        void payTable_FreesTableAndResetsTimestamps() {
            testTable.setOccupiedAt(LocalDateTime.now());
            testTable.setPreparationAt(LocalDateTime.now());

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(orderRepository.findByTableIdAndStatus(anyLong(), anyString())).thenReturn(Optional.empty());

            tableController.payTable(1L);

            verify(tableRepository).save(argThat(table -> 
                "AVAILABLE".equals(table.getStatus()) && 
                table.getOccupiedAt() == null && 
                table.getPreparationAt() == null));
        }
    }

    // ============================================================
    // TESTS PARA getOrderDetails()
    // ============================================================
    @Nested
    @DisplayName("Tests para getOrderDetails()")
    class GetOrderDetailsTests {

        @Test
        @DisplayName("Debe retornar orden OPEN si existe")
        void getOrderDetails_ReturnsOpenOrder() {
            testOrder.setStatus(RestaurantOrder.OrderStatus.PENDING);
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.of(testOrder));

            ResponseEntity<?> result = tableController.getOrderDetails(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals(testOrder, result.getBody());
        }

        @Test
        @DisplayName("Debe retornar orden WAITING_PAYMENT si no hay OPEN")
        void getOrderDetails_ReturnsWaitingPaymentOrder_WhenNoOpen() {
            testOrder.setStatus(RestaurantOrder.OrderStatus.WAITING_PAYMENT);
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.empty());
            when(orderRepository.findByTableIdAndStatus(1L, "WAITING_PAYMENT")).thenReturn(Optional.of(testOrder));

            ResponseEntity<?> result = tableController.getOrderDetails(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals(testOrder, result.getBody());
        }

        @Test
        @DisplayName("Debe retornar 404 cuando no hay orden")
        void getOrderDetails_Returns404_WhenNoOrder() {
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.empty());
            when(orderRepository.findByTableIdAndStatus(1L, "WAITING_PAYMENT")).thenReturn(Optional.empty());

            ResponseEntity<?> result = tableController.getOrderDetails(1L);

            assertEquals(404, result.getStatusCode().value());
        }

        @Test
        @DisplayName("Debe retornar 500 cuando hay excepción")
        void getOrderDetails_Returns500_WhenException() {
            when(orderRepository.findByTableIdAndStatus(anyLong(), anyString()))
                    .thenThrow(new RuntimeException("Error de base de datos"));

            ResponseEntity<?> result = tableController.getOrderDetails(1L);

            assertEquals(500, result.getStatusCode().value());
            assertTrue(result.getBody().toString().contains("Error"));
        }
    }

    // ============================================================
    // TESTS PARA extractDeliveryId() (método privado, testeado indirectamente)
    // ============================================================
    @Nested
    @DisplayName("Tests para extractDeliveryId()")
    class ExtractDeliveryIdTests {

        @Test
        @DisplayName("Debe extraer ID de delivery correctamente")
        void extractDeliveryId_ExtractsCorrectly() {
            testTable.setName("DELIVERY #123");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.startPreparation(1L);

            verify(deliveryOrderService).updateDeliveryOrderStatus(123L, "PREPARING");
        }

        @Test
        @DisplayName("No debe extraer ID cuando nombre es null")
        void extractDeliveryId_ReturnsEmpty_WhenNameIsNull() {
            testTable.setName(null);
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.startPreparation(1L);

            verify(deliveryOrderService, never()).updateDeliveryOrderStatus(anyLong(), anyString());
        }

        @Test
        @DisplayName("No debe extraer ID cuando no tiene prefijo DELIVERY #")
        void extractDeliveryId_ReturnsEmpty_WhenNoPrefixMatch() {
            testTable.setName("Mesa Regular");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.startPreparation(1L);

            verify(deliveryOrderService, never()).updateDeliveryOrderStatus(anyLong(), anyString());
        }

        @Test
        @DisplayName("No debe extraer ID cuando formato de número es inválido")
        void extractDeliveryId_ReturnsEmpty_WhenInvalidNumberFormat() {
            testTable.setName("DELIVERY #abc");
            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.startPreparation(1L);

            verify(deliveryOrderService, never()).updateDeliveryOrderStatus(anyLong(), anyString());
        }
    }

    // ============================================================
    // TESTS PARA cancelOrder()
    // ============================================================
    @Nested
    @DisplayName("Tests para cancelOrder()")
    class CancelOrderTests {

        @Test
        @DisplayName("Debe cancelar pedido en estado OCCUPIED exitosamente")
        void cancelOrder_Success_WhenStatusOccupied() {
            testTable.setStatus("OCCUPIED");
            testTable.setOccupiedAt(LocalDateTime.now());

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.of(testOrder));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("Pedido cancelado y mesa liberada", result.getBody());
            verify(orderRepository).delete(testOrder);
            verify(tableRepository).save(argThat(table -> 
                "AVAILABLE".equals(table.getStatus()) && 
                table.getOccupiedAt() == null));
        }

        @Test
        @DisplayName("Debe cancelar pedido en estado READY_TO_KITCHEN exitosamente")
        void cancelOrder_Success_WhenStatusReadyToKitchen() {
            testTable.setStatus("READY_TO_KITCHEN");
            testTable.setOccupiedAt(LocalDateTime.now());

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.of(testOrder));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(200, result.getStatusCode().value());
            verify(orderRepository).delete(testOrder);
        }

        @Test
        @DisplayName("Debe cancelar pedido en estado WAITING_KITCHEN exitosamente")
        void cancelOrder_Success_WhenStatusWaitingKitchen() {
            testTable.setStatus("WAITING_KITCHEN");
            testTable.setOccupiedAt(LocalDateTime.now());

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.of(testOrder));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(200, result.getStatusCode().value());
            verify(orderRepository).delete(testOrder);
        }

        @Test
        @DisplayName("Debe negar cancelación cuando estado es PREPARING")
        void cancelOrder_ReturnsError_WhenStatusPreparing() {
            testTable.setStatus("PREPARING");

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(400, result.getStatusCode().value());
            assertTrue(result.getBody().toString().contains("No se puede cancelar"));
            verify(orderRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Debe negar cancelación cuando estado es READY")
        void cancelOrder_ReturnsError_WhenStatusReady() {
            testTable.setStatus("READY");

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(400, result.getStatusCode().value());
            verify(orderRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Debe negar cancelación cuando estado es SERVING")
        void cancelOrder_ReturnsError_WhenStatusServing() {
            testTable.setStatus("SERVING");

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(400, result.getStatusCode().value());
            verify(orderRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Debe negar cancelación cuando estado es WAITING_PAYMENT")
        void cancelOrder_ReturnsError_WhenStatusWaitingPayment() {
            testTable.setStatus("WAITING_PAYMENT");

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(400, result.getStatusCode().value());
            verify(orderRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Debe cancelar incluso sin orden existente")
        void cancelOrder_Success_WithoutExistingOrder() {
            testTable.setStatus("OCCUPIED");
            testTable.setOccupiedAt(LocalDateTime.now());

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.empty());
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            ResponseEntity<?> result = tableController.cancelOrder(1L);

            assertEquals(200, result.getStatusCode().value());
            verify(orderRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando mesa no existe")
        void cancelOrder_ThrowsException_WhenTableNotFound() {
            when(tableRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> tableController.cancelOrder(999L));
        }

        @Test
        @DisplayName("Debe resetear timestamps al cancelar")
        void cancelOrder_ResetsTimestamps() {
            testTable.setStatus("OCCUPIED");
            testTable.setOccupiedAt(LocalDateTime.now());
            testTable.setPreparationAt(LocalDateTime.now());

            when(tableRepository.findById(1L)).thenReturn(Optional.of(testTable));
            when(orderRepository.findByTableIdAndStatus(1L, "OPEN")).thenReturn(Optional.of(testOrder));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);

            tableController.cancelOrder(1L);

            verify(tableRepository).save(argThat(table -> 
                table.getOccupiedAt() == null && table.getPreparationAt() == null));
        }
    }
}
