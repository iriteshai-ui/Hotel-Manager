package com.restaurant.controller;

import com.restaurant.model.MenuItem;
import com.restaurant.services.RestaurantService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * MenuController exposes REST endpoints for reading menu data.
 */
@RestController
@RequestMapping("/api/menu")
@CrossOrigin(originPatterns = "*")
public class MenuController {

    @Autowired
    private RestaurantService restaurantService;

    @GetMapping
    public List<MenuItem> getMenuItems() {
        return restaurantService.getMenu();
    }

    @PostMapping
    public void addMenuItem(@RequestBody MenuItem item) {
        restaurantService.addMenuItem(item);
    }

}

    