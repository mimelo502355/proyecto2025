package com.example.Proyect_ing_soft.payload.request;

import java.util.List;

public class CreateDeliveryOrderRequest {
    private String customerName;
    private String phone;
    private String address;
    private String reference;
    private String notes;
    private Double totalAmount;
    private List<DeliveryOrderItemRequest> items;
    
    // Constructors
    public CreateDeliveryOrderRequest() {
    }
    
    public CreateDeliveryOrderRequest(String customerName, String phone, String address, Double totalAmount) {
        this.customerName = customerName;
        this.phone = phone;
        this.address = address;
        this.totalAmount = totalAmount;
    }
    
    // Getters and Setters
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
    
    public Double getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public List<DeliveryOrderItemRequest> getItems() {
        return items;
    }
    
    public void setItems(List<DeliveryOrderItemRequest> items) {
        this.items = items;
    }
    
    // Inner class for items
    public static class DeliveryOrderItemRequest {
        private Long productId;
        private Integer quantity;
        private Double price;
        
        public DeliveryOrderItemRequest() {
        }
        
        public DeliveryOrderItemRequest(Long productId, Integer quantity, Double price) {
            this.productId = productId;
            this.quantity = quantity;
            this.price = price;
        }
        
        public Long getProductId() {
            return productId;
        }
        
        public void setProductId(Long productId) {
            this.productId = productId;
        }
        
        public Integer getQuantity() {
            return quantity;
        }
        
        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
        
        public Double getPrice() {
            return price;
        }
        
        public void setPrice(Double price) {
            this.price = price;
        }
    }
}
