package com.restaurant.controller;

import com.restaurant.model.MenuItem;
import com.restaurant.model.RestaurantTable;
import com.restaurant.repository.TableRepository;
import com.restaurant.services.RestaurantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(originPatterns = "*")
public class InitialDataController {

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private TableRepository tableRepository;

    @GetMapping("/initial_data")
    public Map<String, Object> getInitialData() {
        Map<String, Object> response = new HashMap<>();
        List<MenuItem> menuItems = restaurantService.getMenu();
        response.put("menuItems", menuItems);
        response.put("orders", restaurantService.getActiveOrders());
        List<Map<String, Object>> tables = tableRepository.findAll().stream()
            .sorted((a, b) -> Integer.compare(a.getNumber(), b.getNumber()))
            .map(RestaurantTable::toMap)
            .collect(Collectors.toList());
        response.put("tables", tables);
        return response;
    }
}
