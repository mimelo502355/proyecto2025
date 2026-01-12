package com.example.Proyect_ing_soft.payload.response;

import java.time.LocalDateTime;
import java.util.List;

public class DeliveryOrderResponse {
    private Long id;
    private String customerName;
    private String phone;
    private String address;
    private String reference;
    private String notes;
    private String status;
    private Double totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime readyAt;
    private LocalDateTime dispatchedAt;
    private List<DeliveryOrderItemResponse> items;
    
    // Constructors
    public DeliveryOrderResponse() {
    }
    
    public DeliveryOrderResponse(Long id, String customerName, String phone, String address, 
                                 String status, Double totalAmount, LocalDateTime createdAt) {
        this.id = id;
        this.customerName = customerName;
        this.phone = phone;
        this.address = address;
        this.status = status;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getCustomerName() {
        return customerName;
    }
    
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getReference() {
        return reference;
    }
    
    public void setReference(String reference) {
        this.reference = reference;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Double getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getReadyAt() {
        return readyAt;
    }
    
    public void setReadyAt(LocalDateTime readyAt) {
        this.readyAt = readyAt;
    }
    
    public LocalDateTime getDispatchedAt() {
        return dispatchedAt;
    }
    
    public void setDispatchedAt(LocalDateTime dispatchedAt) {
        this.dispatchedAt = dispatchedAt;
    }
    
    public List<DeliveryOrderItemResponse> getItems() {
        return items;
    }
    
    public void setItems(List<DeliveryOrderItemResponse> items) {
        this.items = items;
    }
    
    // Inner class
    public static class DeliveryOrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private Integer quantity;
        private Double unitPrice;
        private Double subtotal;
        
        public DeliveryOrderItemResponse() {
        }
        
        public DeliveryOrderItemResponse(Long productId, String productName, Integer quantity, Double unitPrice) {
            this.productId = productId;
            this.productName = productName;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.subtotal = unitPrice * quantity;
        }
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public Long getProductId() {
            return productId;
        }
        
        public void setProductId(Long productId) {
            this.productId = productId;
        }
        
        public String getProductName() {
            return productName;
        }
        
        public void setProductName(String productName) {
            this.productName = productName;
        }
        
        public Integer getQuantity() {
            return quantity;
        }
        
        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
        
        public Double getUnitPrice() {
            return unitPrice;
        }
        
        public void setUnitPrice(Double unitPrice) {
            this.unitPrice = unitPrice;
        }
        
        public Double getSubtotal() {
            return subtotal;
        }
        
        public void setSubtotal(Double subtotal) {
            this.subtotal = subtotal;
        }
    }
}
