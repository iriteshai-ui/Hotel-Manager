package com.restaurant.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class Order {
    private String id;
    private int tableNumber;
    private List<OrderItem> items;
    private double totalPrice;
    private OrderStatus status;
    private LocalDateTime timestamp;

    public Order() {
    }

    public Order(int tableNumber, List<OrderItem> items) {
        this.id = UUID.randomUUID().toString();
        this.tableNumber = tableNumber;
        this.items = items;
        this.totalPrice = items.stream().mapToDouble(i -> i.getPrice() * i.getQuantity()).sum();
        this.status = OrderStatus.PLACED;
        this.timestamp = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public int getTableNumber() { return tableNumber; }
    public void setTableNumber(int tableNumber) { this.tableNumber = tableNumber; }
    
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    
    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }
    
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
