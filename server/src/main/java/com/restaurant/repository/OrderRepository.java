package com.restaurant.repository;

import com.restaurant.model.OrderEntity;
import com.restaurant.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {
    List<OrderEntity> findByStatusNot(OrderStatus status);
    List<OrderEntity> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
