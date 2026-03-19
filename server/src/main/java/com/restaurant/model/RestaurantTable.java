package com.restaurant.model;

import jakarta.persistence.*;

@Entity
@Table(name = "restaurant_tables")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private int number;

    private String name;

    private String status = "AVAILABLE";

    private String currentOrderId;

    private int capacity = 4;

    public RestaurantTable() {}

    public RestaurantTable(int number) {
        this.number = number;
        this.name = "Table " + number;
    }

    public Long getId() { return id; }
    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCurrentOrderId() { return currentOrderId; }
    public void setCurrentOrderId(String currentOrderId) { this.currentOrderId = currentOrderId; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public java.util.Map<String, Object> toMap() {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", "t" + number);
        map.put("number", number);
        map.put("name", name);
        map.put("status", status);
        map.put("currentOrderId", currentOrderId);
        map.put("capacity", capacity);
        return map;
    }
}
