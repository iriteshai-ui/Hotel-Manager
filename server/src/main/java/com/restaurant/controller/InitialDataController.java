package com.restaurant.controller;

import com.restaurant.model.MenuItem;
import com.restaurant.services.RestaurantService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*")
public class InitialDataController {

    @Autowired
    private RestaurantService restaurantService;

    @GetMapping("/initial_data")
    public Map<String, Object> getInitialData() {
        Map<String, Object> response = new HashMap<>();
        
        // 1. Get menu items from the service
        List<MenuItem> menuItems = restaurantService.getMenu();
        response.put("menuItems", menuItems);
        
        // 2. Get active orders
        List<com.restaurant.model.Order> activeOrders = restaurantService.getActiveOrders();
        response.put("orders", activeOrders);
        
        // 3. Mock tables (in a real app, these would come from the database)
        // Creating 10 mock tables
        List<Map<String, Object>> tables = IntStream.rangeClosed(1, 10).mapToObj(i -> {
            Map<String, Object> table = new HashMap<>();
            table.put("id", "t" + i);
            table.put("number", i);
            table.put("name", "Table " + i);
            table.put("status", "AVAILABLE"); // Default status
            table.put("currentOrderId", null);
            return table;
        }).collect(Collectors.toList());
        
        response.put("tables", tables);
        
        return response;
    }
}
