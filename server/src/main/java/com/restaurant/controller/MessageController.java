package com.restaurant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.restaurant.controller.OrderController.OrderRequest;
import com.restaurant.model.Order;
import com.restaurant.services.RestaurantService;

import java.util.HashMap;
import java.util.Map;

@Controller
public class MessageController {

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Handles STOMP messages sent to /app/place_order
     */
    @MessageMapping("/place_order")
    public void placeOrder(OrderRequest request) {
        // 1. Process the order via the service
        Order newOrder = restaurantService.placeOrder(request.getTableNumber(), request.getItems());
        
        // 2. Broadcast the new order to all dashboards listening on /topic/order_added
        messagingTemplate.convertAndSend("/topic/order_added", newOrder);

        // 3. Optional: broadcast a table status update if needed
        Map<String, Object> tableUpdate = new HashMap<>();
        tableUpdate.put("id", "t" + request.getTableNumber());
        tableUpdate.put("number", request.getTableNumber());
        tableUpdate.put("status", "OCCUPIED");
        tableUpdate.put("currentOrderId", newOrder.getId());
        
        messagingTemplate.convertAndSend("/topic/table_updated", tableUpdate);
    }

    /**
     * Handles STOMP messages sent to /app/update_order_status
     */
    @MessageMapping("/update_order_status")
    public void updateOrderStatus(UpdateMessage message) {
        System.out.println("WebSocket incoming status update: OrderID=" + message.getOrderId() + ", Status=" + message.getStatus());
        // 1. Update the order status in the service
        Order updatedOrder = restaurantService.updateOrderStatus(message.getOrderId(), message.getStatus());
        
        // 2. Broadcast the updated order
        if (updatedOrder != null) {
            System.out.println("Broadcasting status update for " + updatedOrder.getId());
            messagingTemplate.convertAndSend("/topic/order_updated", updatedOrder);
        } else {
            System.out.println("SKIP BROADCAST: Order not found for ID " + message.getOrderId());
        }
    }

    // DTO for incoming status updates via WebSocket
    static class UpdateMessage {
        private String orderId;
        private com.restaurant.model.OrderStatus status;

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public com.restaurant.model.OrderStatus getStatus() { return status; }
        public void setStatus(com.restaurant.model.OrderStatus status) { this.status = status; }
    }
}
