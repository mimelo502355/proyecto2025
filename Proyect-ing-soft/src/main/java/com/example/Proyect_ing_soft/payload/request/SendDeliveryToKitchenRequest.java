package com.example.Proyect_ing_soft.payload.request;

import java.util.List;

public class SendDeliveryToKitchenRequest {
    private List<KitchenItem> items;
    
    public SendDeliveryToKitchenRequest() {
    }
    
    public SendDeliveryToKitchenRequest(List<KitchenItem> items) {
        this.items = items;
    }
    
    public List<KitchenItem> getItems() {
        return items;
    }
    
    public void setItems(List<KitchenItem> items) {
        this.items = items;
    }
    
    // Inner class
    public static class KitchenItem {
        private Long productId;
        private Integer quantity;
        
        public KitchenItem() {
        }
        
        public KitchenItem(Long productId, Integer quantity) {
            this.productId = productId;
            this.quantity = quantity;
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
    }
}
