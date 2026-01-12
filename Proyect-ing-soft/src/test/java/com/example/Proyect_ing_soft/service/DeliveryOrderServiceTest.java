package com.example.Proyect_ing_soft.service;

import com.example.Proyect_ing_soft.model.*;
import com.example.Proyect_ing_soft.payload.request.CreateDeliveryOrderRequest;
import com.example.Proyect_ing_soft.payload.request.SendDeliveryToKitchenRequest;
import com.example.Proyect_ing_soft.payload.response.DeliveryOrderResponse;
import com.example.Proyect_ing_soft.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de Tests de Caja Blanca para DeliveryOrderService
 * Cobertura: 100% de caminos de ejecución, condicionales, loops y excepciones
 */
@ExtendWith(MockitoExtension.class)
class DeliveryOrderServiceTest {

    @Mock
    private DeliveryOrderRepository deliveryOrderRepository;

    @Mock
    private DeliveryOrderItemRepository deliveryOrderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private TableRepository tableRepository;

    @InjectMocks
    private DeliveryOrderService deliveryOrderService;

    private DeliveryOrder testDeliveryOrder;
    private Product testProduct;
    private RestaurantTable testTable;

    @BeforeEach
    void setUp() {
        // Producto de prueba
        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("Pizza");
        testProduct.setPrice(25.0);

        // Mesa virtual de prueba
        testTable = new RestaurantTable();
        testTable.setId(100L);
        testTable.setName("DELIVERY #1");
        testTable.setCapacity(0);

        // DeliveryOrder de prueba
        testDeliveryOrder = new DeliveryOrder();
        testDeliveryOrder.setId(1L);
        testDeliveryOrder.setCustomerName("Juan Pérez");
        testDeliveryOrder.setPhone("999888777");
        testDeliveryOrder.setAddress("Av. Principal 123");
        testDeliveryOrder.setReference("Cerca al parque");
        testDeliveryOrder.setNotes("Sin cebolla");
        testDeliveryOrder.setTotalAmount(50.0);
        testDeliveryOrder.setStatus(DeliveryOrder.DeliveryStatus.PENDING);
        testDeliveryOrder.setCreatedAt(LocalDateTime.now());
    }

    // ============================================================
    // TESTS PARA createDeliveryOrder()
    // ============================================================
    @Nested
    @DisplayName("Tests para createDeliveryOrder()")
    class CreateDeliveryOrderTests {

        @Test
        @DisplayName("Debe crear orden sin items cuando items es null")
        void createDeliveryOrder_CreatesOrder_WhenItemsIsNull() {
            CreateDeliveryOrderRequest request = new CreateDeliveryOrderRequest();
            request.setCustomerName("Juan");
            request.setPhone("999");
            request.setAddress("Dir");
            request.setTotalAmount(100.0);
            request.setItems(null);

            when(deliveryOrderRepository.save(any(DeliveryOrder.class)))
                    .thenAnswer(i -> {
                        DeliveryOrder order = i.getArgument(0);
                        order.setId(1L);
                        return order;
                    });

            DeliveryOrderResponse result = deliveryOrderService.createDeliveryOrder(request);

            assertNotNull(result);
            assertEquals("Juan", result.getCustomerName());
            verify(deliveryOrderRepository, times(1)).save(any(DeliveryOrder.class));
        }

        @Test
        @DisplayName("Debe crear orden sin items cuando items está vacío")
        void createDeliveryOrder_CreatesOrder_WhenItemsIsEmpty() {
            CreateDeliveryOrderRequest request = new CreateDeliveryOrderRequest();
            request.setCustomerName("Juan");
            request.setPhone("999");
            request.setAddress("Dir");
            request.setTotalAmount(100.0);
            request.setItems(new ArrayList<>());

            when(deliveryOrderRepository.save(any(DeliveryOrder.class)))
                    .thenAnswer(i -> {
                        DeliveryOrder order = i.getArgument(0);
                        order.setId(1L);
                        return order;
                    });

            DeliveryOrderResponse result = deliveryOrderService.createDeliveryOrder(request);

            assertNotNull(result);
            verify(deliveryOrderRepository, times(1)).save(any(DeliveryOrder.class));
        }

        @Test
        @DisplayName("Debe crear orden con items correctamente")
        void createDeliveryOrder_CreatesOrderWithItems() {
            CreateDeliveryOrderRequest.DeliveryOrderItemRequest itemRequest = 
                new CreateDeliveryOrderRequest.DeliveryOrderItemRequest();
            itemRequest.setProductId(1L);
            itemRequest.setQuantity(2);
            itemRequest.setPrice(25.0);

            CreateDeliveryOrderRequest request = new CreateDeliveryOrderRequest();
            request.setCustomerName("Juan");
            request.setPhone("999");
            request.setAddress("Dir");
            request.setTotalAmount(50.0);
            request.setItems(Collections.singletonList(itemRequest));

            when(deliveryOrderRepository.save(any(DeliveryOrder.class)))
                    .thenAnswer(i -> {
                        DeliveryOrder order = i.getArgument(0);
                        order.setId(1L);
                        return order;
                    });
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

            DeliveryOrderResponse result = deliveryOrderService.createDeliveryOrder(request);

            assertNotNull(result);
            verify(productRepository).findById(1L);
            verify(deliveryOrderRepository, times(2)).save(any(DeliveryOrder.class));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando producto no existe")
        void createDeliveryOrder_ThrowsException_WhenProductNotFound() {
            CreateDeliveryOrderRequest.DeliveryOrderItemRequest itemRequest = 
                new CreateDeliveryOrderRequest.DeliveryOrderItemRequest();
            itemRequest.setProductId(999L);
            itemRequest.setQuantity(2);
            itemRequest.setPrice(25.0);

            CreateDeliveryOrderRequest request = new CreateDeliveryOrderRequest();
            request.setCustomerName("Juan");
            request.setItems(Collections.singletonList(itemRequest));

            when(deliveryOrderRepository.save(any(DeliveryOrder.class)))
                    .thenAnswer(i -> {
                        DeliveryOrder order = i.getArgument(0);
                        order.setId(1L);
                        return order;
                    });
            when(productRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> deliveryOrderService.createDeliveryOrder(request));
        }

        @Test
        @DisplayName("Debe crear orden con múltiples items")
        void createDeliveryOrder_CreatesOrderWithMultipleItems() {
            Product product2 = new Product();
            product2.setId(2L);
            product2.setName("Hamburguesa");
            product2.setPrice(15.0);

            CreateDeliveryOrderRequest.DeliveryOrderItemRequest item1 = 
                new CreateDeliveryOrderRequest.DeliveryOrderItemRequest();
            item1.setProductId(1L);
            item1.setQuantity(2);
            item1.setPrice(25.0);

            CreateDeliveryOrderRequest.DeliveryOrderItemRequest item2 = 
                new CreateDeliveryOrderRequest.DeliveryOrderItemRequest();
            item2.setProductId(2L);
            item2.setQuantity(1);
            item2.setPrice(15.0);

            CreateDeliveryOrderRequest request = new CreateDeliveryOrderRequest();
            request.setCustomerName("Juan");
            request.setItems(Arrays.asList(item1, item2));

            when(deliveryOrderRepository.save(any(DeliveryOrder.class)))
                    .thenAnswer(i -> {
                        DeliveryOrder order = i.getArgument(0);
                        order.setId(1L);
                        return order;
                    });
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(productRepository.findById(2L)).thenReturn(Optional.of(product2));

            DeliveryOrderResponse result = deliveryOrderService.createDeliveryOrder(request);

            assertNotNull(result);
            verify(productRepository, times(2)).findById(anyLong());
        }
    }

    // ============================================================
    // TESTS PARA sendDeliveryToKitchen()
    // ============================================================
    @Nested
    @DisplayName("Tests para sendDeliveryToKitchen()")
    class SendDeliveryToKitchenTests {

        @Test
        @DisplayName("Debe lanzar excepción cuando request es null")
        void sendDeliveryToKitchen_ThrowsException_WhenRequestIsNull() {
            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(1L, null));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando items es null")
        void sendDeliveryToKitchen_ThrowsException_WhenItemsIsNull() {
            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(null);

            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(1L, request));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando items está vacío")
        void sendDeliveryToKitchen_ThrowsException_WhenItemsIsEmpty() {
            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(new ArrayList<>());

            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(1L, request));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando delivery order no existe")
        void sendDeliveryToKitchen_ThrowsException_WhenDeliveryOrderNotFound() {
            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(1L);
            kitchenItem.setQuantity(2);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(999L, request));
        }

        @Test
        @DisplayName("Debe crear nueva mesa virtual cuando no existe")
        void sendDeliveryToKitchen_CreatesNewVirtualTable_WhenNotExists() {
            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(1L);
            kitchenItem.setQuantity(2);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(tableRepository.findByName("DELIVERY #1")).thenReturn(Optional.empty());
            when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(i -> {
                RestaurantTable t = i.getArgument(0);
                t.setId(100L);
                return t;
            });
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(orderRepository.save(any(RestaurantOrder.class))).thenAnswer(i -> {
                RestaurantOrder o = i.getArgument(0);
                o.setId(10L);
                return o;
            });
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenReturn(testDeliveryOrder);

            String result = deliveryOrderService.sendDeliveryToKitchen(1L, request);

            assertTrue(result.contains("Pedido de delivery enviado a cocina"));
            verify(tableRepository).findByName("DELIVERY #1");
            verify(tableRepository).save(any(RestaurantTable.class));
        }

        @Test
        @DisplayName("Debe reutilizar mesa virtual existente")
        void sendDeliveryToKitchen_ReusesExistingVirtualTable() {
            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(1L);
            kitchenItem.setQuantity(2);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(tableRepository.findByName("DELIVERY #1")).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(orderRepository.save(any(RestaurantOrder.class))).thenAnswer(i -> {
                RestaurantOrder o = i.getArgument(0);
                o.setId(10L);
                return o;
            });
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenReturn(testDeliveryOrder);

            String result = deliveryOrderService.sendDeliveryToKitchen(1L, request);

            assertNotNull(result);
            verify(tableRepository).findByName("DELIVERY #1");
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando producto no existe")
        void sendDeliveryToKitchen_ThrowsException_WhenProductNotFound() {
            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(999L);
            kitchenItem.setQuantity(2);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(tableRepository.findByName("DELIVERY #1")).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(productRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(1L, request));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando cantidad es inválida (0)")
        void sendDeliveryToKitchen_ThrowsException_WhenQuantityIsZero() {
            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(1L);
            kitchenItem.setQuantity(0);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(tableRepository.findByName("DELIVERY #1")).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(1L, request));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando cantidad es negativa")
        void sendDeliveryToKitchen_ThrowsException_WhenQuantityIsNegative() {
            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(1L);
            kitchenItem.setQuantity(-5);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(tableRepository.findByName("DELIVERY #1")).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(1L, request));
        }

        @Test
        @DisplayName("Debe usar precio 0 cuando producto no tiene precio")
        void sendDeliveryToKitchen_UsesZeroPrice_WhenProductPriceIsNull() {
            Product productWithoutPrice = new Product();
            productWithoutPrice.setId(2L);
            productWithoutPrice.setName("Producto sin precio");
            productWithoutPrice.setPrice(null);

            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(2L);
            kitchenItem.setQuantity(1);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(tableRepository.findByName("DELIVERY #1")).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(productRepository.findById(2L)).thenReturn(Optional.of(productWithoutPrice));
            when(orderRepository.save(any(RestaurantOrder.class))).thenAnswer(i -> {
                RestaurantOrder o = i.getArgument(0);
                o.setId(10L);
                return o;
            });
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenReturn(testDeliveryOrder);

            String result = deliveryOrderService.sendDeliveryToKitchen(1L, request);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Debe usar cantidad 0 cuando quantity es null y lanzar excepción")
        void sendDeliveryToKitchen_ThrowsException_WhenQuantityIsNull() {
            SendDeliveryToKitchenRequest.KitchenItem kitchenItem = new SendDeliveryToKitchenRequest.KitchenItem();
            kitchenItem.setProductId(1L);
            kitchenItem.setQuantity(null);

            SendDeliveryToKitchenRequest request = new SendDeliveryToKitchenRequest();
            request.setItems(Collections.singletonList(kitchenItem));

            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(tableRepository.findByName("DELIVERY #1")).thenReturn(Optional.of(testTable));
            when(tableRepository.save(any(RestaurantTable.class))).thenReturn(testTable);
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.sendDeliveryToKitchen(1L, request));
        }
    }

    // ============================================================
    // TESTS PARA getDeliveryOrderById()
    // ============================================================
    @Nested
    @DisplayName("Tests para getDeliveryOrderById()")
    class GetDeliveryOrderByIdTests {

        @Test
        @DisplayName("Debe retornar orden cuando existe")
        void getDeliveryOrderById_ReturnsOrder_WhenExists() {
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));

            DeliveryOrderResponse result = deliveryOrderService.getDeliveryOrderById(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("Juan Pérez", result.getCustomerName());
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando no existe")
        void getDeliveryOrderById_ThrowsException_WhenNotFound() {
            when(deliveryOrderRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> deliveryOrderService.getDeliveryOrderById(999L));
        }
    }

    // ============================================================
    // TESTS PARA getAllDeliveryOrders()
    // ============================================================
    @Nested
    @DisplayName("Tests para getAllDeliveryOrders()")
    class GetAllDeliveryOrdersTests {

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay órdenes")
        void getAllDeliveryOrders_ReturnsEmptyList_WhenNoOrders() {
            when(deliveryOrderRepository.findAllByOrderByCreatedAtDesc())
                    .thenReturn(Collections.emptyList());

            List<DeliveryOrderResponse> result = deliveryOrderService.getAllDeliveryOrders();

            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Debe retornar todas las órdenes ordenadas")
        void getAllDeliveryOrders_ReturnsAllOrders() {
            DeliveryOrder order2 = new DeliveryOrder();
            order2.setId(2L);
            order2.setCustomerName("María");
            order2.setStatus(DeliveryOrder.DeliveryStatus.PENDING);

            when(deliveryOrderRepository.findAllByOrderByCreatedAtDesc())
                    .thenReturn(Arrays.asList(testDeliveryOrder, order2));

            List<DeliveryOrderResponse> result = deliveryOrderService.getAllDeliveryOrders();

            assertEquals(2, result.size());
        }
    }

    // ============================================================
    // TESTS PARA getDeliveryOrdersByStatus()
    // ============================================================
    @Nested
    @DisplayName("Tests para getDeliveryOrdersByStatus()")
    class GetDeliveryOrdersByStatusTests {

        @Test
        @DisplayName("Debe retornar órdenes con estado PENDING")
        void getDeliveryOrdersByStatus_ReturnsOrders_WhenStatusPending() {
            when(deliveryOrderRepository.findByStatus(DeliveryOrder.DeliveryStatus.PENDING))
                    .thenReturn(Collections.singletonList(testDeliveryOrder));

            List<DeliveryOrderResponse> result = deliveryOrderService.getDeliveryOrdersByStatus("PENDING");

            assertEquals(1, result.size());
            assertEquals("PENDING", result.get(0).getStatus());
        }

        @Test
        @DisplayName("Debe manejar estado en minúsculas")
        void getDeliveryOrdersByStatus_HandlesLowercase() {
            when(deliveryOrderRepository.findByStatus(DeliveryOrder.DeliveryStatus.PREPARING))
                    .thenReturn(Collections.emptyList());

            List<DeliveryOrderResponse> result = deliveryOrderService.getDeliveryOrdersByStatus("preparing");

            assertNotNull(result);
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando estado es inválido")
        void getDeliveryOrdersByStatus_ThrowsException_WhenInvalidStatus() {
            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.getDeliveryOrdersByStatus("INVALID_STATUS"));
        }
    }

    // ============================================================
    // TESTS PARA updateDeliveryOrderStatus()
    // ============================================================
    @Nested
    @DisplayName("Tests para updateDeliveryOrderStatus()")
    class UpdateDeliveryOrderStatusTests {

        @Test
        @DisplayName("Debe lanzar excepción cuando orden no existe")
        void updateDeliveryOrderStatus_ThrowsException_WhenOrderNotFound() {
            when(deliveryOrderRepository.findById(999L)).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> deliveryOrderService.updateDeliveryOrderStatus(999L, "READY"));
        }

        @Test
        @DisplayName("Debe actualizar estado a READY y establecer readyAt")
        void updateDeliveryOrderStatus_SetsReadyAt_WhenStatusReady() {
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenAnswer(i -> i.getArgument(0));

            DeliveryOrderResponse result = deliveryOrderService.updateDeliveryOrderStatus(1L, "READY");

            assertEquals("READY", result.getStatus());
            assertNotNull(result.getReadyAt());
        }

        @Test
        @DisplayName("Debe actualizar estado a DISPATCHED y establecer dispatchedAt")
        void updateDeliveryOrderStatus_SetsDispatchedAt_WhenStatusDispatched() {
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenAnswer(i -> i.getArgument(0));

            DeliveryOrderResponse result = deliveryOrderService.updateDeliveryOrderStatus(1L, "DISPATCHED");

            assertEquals("DISPATCHED", result.getStatus());
            assertNotNull(result.getDispatchedAt());
        }

        @Test
        @DisplayName("Debe actualizar estado a DELIVERED y establecer deliveredAt")
        void updateDeliveryOrderStatus_SetsDeliveredAt_WhenStatusDelivered() {
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenAnswer(i -> i.getArgument(0));

            deliveryOrderService.updateDeliveryOrderStatus(1L, "DELIVERED");

            verify(deliveryOrderRepository).save(argThat(order -> 
                order.getDeliveredAt() != null));
        }

        @Test
        @DisplayName("Debe actualizar a PREPARING sin establecer timestamps adicionales")
        void updateDeliveryOrderStatus_NoExtraTimestamp_WhenStatusPreparing() {
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenAnswer(i -> i.getArgument(0));

            DeliveryOrderResponse result = deliveryOrderService.updateDeliveryOrderStatus(1L, "PREPARING");

            assertEquals("PREPARING", result.getStatus());
            assertNull(result.getReadyAt());
            assertNull(result.getDispatchedAt());
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando estado es inválido")
        void updateDeliveryOrderStatus_ThrowsException_WhenInvalidStatus() {
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));

            assertThrows(IllegalArgumentException.class,
                    () -> deliveryOrderService.updateDeliveryOrderStatus(1L, "INVALID"));
        }

        @Test
        @DisplayName("Debe manejar estado en minúsculas")
        void updateDeliveryOrderStatus_HandlesLowercaseStatus() {
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));
            when(deliveryOrderRepository.save(any(DeliveryOrder.class))).thenAnswer(i -> i.getArgument(0));

            DeliveryOrderResponse result = deliveryOrderService.updateDeliveryOrderStatus(1L, "ready");

            assertEquals("READY", result.getStatus());
        }
    }

    // ============================================================
    // TESTS PARA convertToResponse() (privado, testeado indirectamente)
    // ============================================================
    @Nested
    @DisplayName("Tests para convertToResponse()")
    class ConvertToResponseTests {

        @Test
        @DisplayName("Debe convertir orden sin items correctamente")
        void convertToResponse_ConvertsOrderWithoutItems() {
            testDeliveryOrder.setItems(null);
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));

            DeliveryOrderResponse result = deliveryOrderService.getDeliveryOrderById(1L);

            assertNull(result.getItems());
        }

        @Test
        @DisplayName("Debe convertir orden con items vacíos")
        void convertToResponse_ConvertsOrderWithEmptyItems() {
            testDeliveryOrder.setItems(new HashSet<>());
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));

            DeliveryOrderResponse result = deliveryOrderService.getDeliveryOrderById(1L);

            assertNull(result.getItems());
        }

        @Test
        @DisplayName("Debe convertir orden con items correctamente")
        void convertToResponse_ConvertsOrderWithItems() {
            DeliveryOrderItem item = new DeliveryOrderItem(testDeliveryOrder, testProduct, 2, 25.0);
            item.setId(1L);
            testDeliveryOrder.setItems(new HashSet<>(Collections.singletonList(item)));
            
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));

            DeliveryOrderResponse result = deliveryOrderService.getDeliveryOrderById(1L);

            assertNotNull(result.getItems());
            assertEquals(1, result.getItems().size());
        }

        @Test
        @DisplayName("Debe mapear todos los campos correctamente")
        void convertToResponse_MapsAllFields() {
            testDeliveryOrder.setReadyAt(LocalDateTime.now());
            testDeliveryOrder.setDispatchedAt(LocalDateTime.now());
            when(deliveryOrderRepository.findById(1L)).thenReturn(Optional.of(testDeliveryOrder));

            DeliveryOrderResponse result = deliveryOrderService.getDeliveryOrderById(1L);

            assertEquals(testDeliveryOrder.getId(), result.getId());
            assertEquals(testDeliveryOrder.getCustomerName(), result.getCustomerName());
            assertEquals(testDeliveryOrder.getPhone(), result.getPhone());
            assertEquals(testDeliveryOrder.getAddress(), result.getAddress());
            assertEquals(testDeliveryOrder.getReference(), result.getReference());
            assertEquals(testDeliveryOrder.getNotes(), result.getNotes());
            assertEquals(testDeliveryOrder.getTotalAmount(), result.getTotalAmount());
            assertNotNull(result.getReadyAt());
            assertNotNull(result.getDispatchedAt());
        }
    }
}
