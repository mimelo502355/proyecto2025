package com.example.Proyect_ing_soft.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.Proyect_ing_soft.model.DeliveryOrder;
import com.example.Proyect_ing_soft.model.DeliveryOrderItem;
import com.example.Proyect_ing_soft.model.Product;
import com.example.Proyect_ing_soft.model.RestaurantTable;
import com.example.Proyect_ing_soft.model.RestaurantOrder;
import com.example.Proyect_ing_soft.payload.request.CreateDeliveryOrderRequest;
import com.example.Proyect_ing_soft.payload.request.SendDeliveryToKitchenRequest;
import com.example.Proyect_ing_soft.payload.response.DeliveryOrderResponse;
import com.example.Proyect_ing_soft.repository.DeliveryOrderRepository;
import com.example.Proyect_ing_soft.repository.DeliveryOrderItemRepository;
import com.example.Proyect_ing_soft.repository.ProductRepository;
import com.example.Proyect_ing_soft.repository.OrderRepository;
import com.example.Proyect_ing_soft.repository.TableRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DeliveryOrderService {
    
    private final DeliveryOrderRepository deliveryOrderRepository;
    private final DeliveryOrderItemRepository deliveryOrderItemRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final TableRepository tableRepository;
    
    public DeliveryOrderService(DeliveryOrderRepository deliveryOrderRepository,
                               DeliveryOrderItemRepository deliveryOrderItemRepository,
                               ProductRepository productRepository,
                               OrderRepository orderRepository,
                               TableRepository tableRepository) {
        this.deliveryOrderRepository = deliveryOrderRepository;
        this.deliveryOrderItemRepository = deliveryOrderItemRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.tableRepository = tableRepository;
    }
    
    @Transactional
    public DeliveryOrderResponse createDeliveryOrder(CreateDeliveryOrderRequest request) {
        DeliveryOrder deliveryOrder = new DeliveryOrder();
        deliveryOrder.setCustomerName(request.getCustomerName());
        deliveryOrder.setPhone(request.getPhone());
        deliveryOrder.setAddress(request.getAddress());
        deliveryOrder.setReference(request.getReference());
        deliveryOrder.setNotes(request.getNotes());
        deliveryOrder.setTotalAmount(request.getTotalAmount());
        deliveryOrder.setStatus(DeliveryOrder.DeliveryStatus.PENDING);
        deliveryOrder.setCreatedAt(LocalDateTime.now());
        
        // Guardar orden primero
        DeliveryOrder savedOrder = deliveryOrderRepository.save(deliveryOrder);
        
        // Añadir items
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            Set<DeliveryOrderItem> items = new HashSet<>();
            for (CreateDeliveryOrderRequest.DeliveryOrderItemRequest itemRequest : request.getItems()) {
                Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
                
                DeliveryOrderItem item = new DeliveryOrderItem(savedOrder, product, 
                    itemRequest.getQuantity(), itemRequest.getPrice());
                items.add(item);
            }
            savedOrder.setItems(items);
            deliveryOrderRepository.save(savedOrder);
        }
        
        return convertToResponse(savedOrder);
    }
    
    @Transactional
    public String sendDeliveryToKitchen(Long deliveryOrderId, SendDeliveryToKitchenRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("La lista de items no puede estar vacía");
        }

        DeliveryOrder deliveryOrder = deliveryOrderRepository.findById(deliveryOrderId)
            .orElseThrow(() -> new EntityNotFoundException("Pedido de delivery no encontrado"));

        // Crear/recuperar una "mesa" virtual para que la cocina vea el pedido
        String virtualTableName = "DELIVERY #" + deliveryOrderId;
        RestaurantTable virtualTable = tableRepository.findByName(virtualTableName)
            .orElseGet(() -> {
                RestaurantTable t = new RestaurantTable();
                t.setName(virtualTableName);
                t.setCapacity(0);
                return t;
            });
        virtualTable.setStatus("WAITING_KITCHEN");
        virtualTable.setOccupiedAt(LocalDateTime.now());
        virtualTable.setPreparationAt(null);
        virtualTable = tableRepository.save(virtualTable);

        // Crear una orden de cocina para el delivery
        RestaurantOrder kitchenOrder = new RestaurantOrder();
        kitchenOrder.setStatus(RestaurantOrder.OrderStatus.PENDING);
        kitchenOrder.setTableId(virtualTable.getId());
        kitchenOrder.setTableName(virtualTableName);
        kitchenOrder.setTableNumber(virtualTable.getId().intValue()); // mantiene compatibilidad con tablero de cocina
        kitchenOrder.setTotalAmount(deliveryOrder.getTotalAmount());
        kitchenOrder.setCreatedAt(LocalDateTime.now());
        
        // Añadir los items a la orden de cocina
        Set<com.example.Proyect_ing_soft.model.OrderItem> kitchenItems = new HashSet<>();
        for (SendDeliveryToKitchenRequest.KitchenItem kitchenItem : request.getItems()) {
            Product product = productRepository.findById(kitchenItem.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
            
            double unitPrice = product.getPrice() != null ? product.getPrice() : 0d;
            int quantity = kitchenItem.getQuantity() != null ? kitchenItem.getQuantity() : 0;
            if (quantity <= 0) {
                throw new IllegalArgumentException("Cantidad inválida para el producto " + product.getId());
            }

            com.example.Proyect_ing_soft.model.OrderItem orderItem = new com.example.Proyect_ing_soft.model.OrderItem();
            orderItem.setOrder(kitchenOrder);
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(quantity);
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(unitPrice * quantity);
            kitchenItems.add(orderItem);
        }
        kitchenOrder.setItems(kitchenItems);
        
        // Guardar orden de cocina
        RestaurantOrder savedKitchenOrder = orderRepository.save(kitchenOrder);
        
        // Actualizar estado del delivery a PREPARING (como lo hace tableService.sendToKitchen)
        deliveryOrder.setStatus(DeliveryOrder.DeliveryStatus.PREPARING);
        deliveryOrderRepository.save(deliveryOrder);
        
        return "Pedido de delivery enviado a cocina. Orden de cocina #" + savedKitchenOrder.getId();
    }
    
    public DeliveryOrderResponse getDeliveryOrderById(Long id) {
        DeliveryOrder deliveryOrder = deliveryOrderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Pedido de delivery no encontrado"));
        return convertToResponse(deliveryOrder);
    }
    
    public List<DeliveryOrderResponse> getAllDeliveryOrders() {
        return deliveryOrderRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public List<DeliveryOrderResponse> getDeliveryOrdersByStatus(String status) {
        try {
            DeliveryOrder.DeliveryStatus deliveryStatus = DeliveryOrder.DeliveryStatus.valueOf(status.toUpperCase());
            return deliveryOrderRepository.findByStatus(deliveryStatus).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de delivery inválido: " + status);
        }
    }
    
    @Transactional
    public DeliveryOrderResponse updateDeliveryOrderStatus(Long id, String newStatus) {
        DeliveryOrder deliveryOrder = deliveryOrderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Pedido de delivery no encontrado"));
        
        try {
            DeliveryOrder.DeliveryStatus status = DeliveryOrder.DeliveryStatus.valueOf(newStatus.toUpperCase());
            deliveryOrder.setStatus(status);
            
            // Registrar timestamps importantes
            if (status == DeliveryOrder.DeliveryStatus.READY) {
                deliveryOrder.setReadyAt(LocalDateTime.now());
            } else if (status == DeliveryOrder.DeliveryStatus.DISPATCHED) {
                deliveryOrder.setDispatchedAt(LocalDateTime.now());
            } else if (status == DeliveryOrder.DeliveryStatus.DELIVERED) {
                deliveryOrder.setDeliveredAt(LocalDateTime.now());
            }
            
            DeliveryOrder updated = deliveryOrderRepository.save(deliveryOrder);
            return convertToResponse(updated);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado de delivery inválido: " + newStatus);
        }
    }
    
    private DeliveryOrderResponse convertToResponse(DeliveryOrder deliveryOrder) {
        DeliveryOrderResponse response = new DeliveryOrderResponse();
        response.setId(deliveryOrder.getId());
        response.setCustomerName(deliveryOrder.getCustomerName());
        response.setPhone(deliveryOrder.getPhone());
        response.setAddress(deliveryOrder.getAddress());
        response.setReference(deliveryOrder.getReference());
        response.setNotes(deliveryOrder.getNotes());
        response.setStatus(deliveryOrder.getStatus().toString());
        response.setTotalAmount(deliveryOrder.getTotalAmount());
        response.setCreatedAt(deliveryOrder.getCreatedAt());
        response.setReadyAt(deliveryOrder.getReadyAt());
        response.setDispatchedAt(deliveryOrder.getDispatchedAt());
        
        if (deliveryOrder.getItems() != null && !deliveryOrder.getItems().isEmpty()) {
            List<DeliveryOrderResponse.DeliveryOrderItemResponse> itemResponses = 
                deliveryOrder.getItems().stream()
                    .map(item -> {
                        DeliveryOrderResponse.DeliveryOrderItemResponse itemResp = 
                            new DeliveryOrderResponse.DeliveryOrderItemResponse(
                                item.getProduct().getId(),
                                item.getProduct().getName(),
                                item.getQuantity(),
                                item.getUnitPrice()
                            );
                        itemResp.setId(item.getId());
                        itemResp.setSubtotal(item.getSubtotal());
                        return itemResp;
                    })
                    .collect(Collectors.toList());
            response.setItems(itemResponses);
        }
        
        return response;
    }
}
