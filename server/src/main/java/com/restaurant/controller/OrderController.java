package com.restaurant.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.restaurant.model.Order;
import com.restaurant.model.OrderItem;
import com.restaurant.model.OrderStatus;
import com.restaurant.services.RestaurantService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(originPatterns = "*")
public class OrderController {

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public Order placeOrder(@RequestBody OrderRequest request) {
        Order newOrder = restaurantService.placeOrder(request.getTableNumber(), request.getItems());
        messagingTemplate.convertAndSend("/topic/order_added", newOrder);
        return newOrder;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return restaurantService.getAllOrders();
    }

    @GetMapping("/active")
    public List<Order> getActiveOrders() {
        return restaurantService.getActiveOrders();
    }

    @GetMapping("/{id}")
    public Order getOrder(@PathVariable("id") String orderId) {
        return restaurantService.getOrder(orderId);
    }

    @PutMapping("/{id}/status")
    public Order updateStatus(@PathVariable("id") String id, @RequestBody StatusUpdate update) {
        Order updatedOrder = restaurantService.updateOrderStatus(id, update.getStatus());
        if (updatedOrder != null) {
            messagingTemplate.convertAndSend("/topic/order_updated", updatedOrder);
        }
        return updatedOrder;
    }

    // DTOs
    static class OrderRequest {
        private int tableNumber;
        private List<OrderItem> items;

        public int getTableNumber() {
            return tableNumber;
        }

        public void setTableNumber(int tableNumber) {
            this.tableNumber = tableNumber;
        }

        public List<OrderItem> getItems() {
            return items;
        }

        public void setItems(List<OrderItem> items) {
            this.items = items;
        }
    }

    static class StatusUpdate {
        private OrderStatus status;

        public OrderStatus getStatus() {
            return status;
        }

        public void setStatus(OrderStatus status) {
            this.status = status;
        }
    }
}
