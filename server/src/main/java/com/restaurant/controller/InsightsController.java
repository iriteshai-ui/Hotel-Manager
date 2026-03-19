package com.restaurant.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.model.OrderEntity;
import com.restaurant.model.OrderItem;
import com.restaurant.model.OrderStatus;
import com.restaurant.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/insights")
@CrossOrigin(originPatterns = "*")
public class InsightsController {

    @Autowired
    private OrderRepository orderRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/daily")
    public Map<String, Object> getDailyInsights(@RequestParam(required = false) String date) {
        LocalDate targetDate = (date != null) ? LocalDate.parse(date) : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.plusDays(1).atStartOfDay();

        List<OrderEntity> orders = orderRepository.findByTimestampBetween(start, end);

        double totalRevenue = orders.stream().mapToDouble(OrderEntity::getTotalPrice).sum();
        long totalOrders = orders.size();
        long completedOrders = orders.stream().filter(o -> o.getStatus() == OrderStatus.PAID || o.getStatus() == OrderStatus.SERVED).count();

        Map<String, Double> revenueByCategory = new HashMap<>();
        Map<String, Integer> itemCounts = new HashMap<>();

        for (OrderEntity order : orders) {
            try {
                List<OrderItem> items = objectMapper.readValue(order.getItemsJson(), new TypeReference<>() {});
                for (OrderItem item : items) {
                    itemCounts.merge(item.getName(), item.getQuantity(), Integer::sum);
                }
            } catch (Exception ignored) {}
        }

        List<Map<String, Object>> topItems = itemCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(5)
            .map(e -> Map.<String, Object>of("name", e.getKey(), "count", e.getValue()))
            .collect(Collectors.toList());

        Map<String, Long> ordersByStatus = orders.stream()
            .collect(Collectors.groupingBy(o -> o.getStatus().name(), Collectors.counting()));

        Map<String, Object> result = new HashMap<>();
        result.put("date", targetDate.toString());
        result.put("totalRevenue", totalRevenue);
        result.put("totalOrders", totalOrders);
        result.put("completedOrders", completedOrders);
        result.put("topItems", topItems);
        result.put("ordersByStatus", ordersByStatus);
        result.put("orders", orders.stream().map(this::toOrderMap).collect(Collectors.toList()));
        return result;
    }

    private Map<String, Object> toOrderMap(OrderEntity o) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", o.getId());
        map.put("tableNumber", o.getTableNumber());
        map.put("totalPrice", o.getTotalPrice());
        map.put("status", o.getStatus().name());
        map.put("timestamp", o.getTimestamp().toString());
        try {
            map.put("items", objectMapper.readValue(o.getItemsJson(), new TypeReference<List<OrderItem>>() {}));
        } catch (Exception ignored) {
            map.put("items", List.of());
        }
        return map;
    }
}
