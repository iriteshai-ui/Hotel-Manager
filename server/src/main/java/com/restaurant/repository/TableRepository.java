package com.restaurant.repository;

import com.restaurant.model.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TableRepository extends JpaRepository<RestaurantTable, Long> {
    Optional<RestaurantTable> findByNumber(int number);
    boolean existsByNumber(int number);
}
