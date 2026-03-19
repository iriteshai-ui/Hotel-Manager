package com.restaurant.config;

import com.restaurant.services.AuthService;
import com.restaurant.services.RestaurantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    @Autowired
    private AuthService authService;

    @Autowired
    private RestaurantService restaurantService;

    @Override
    public void run(ApplicationArguments args) {
        authService.seedUsers();
        restaurantService.seedTables();
    }
}
