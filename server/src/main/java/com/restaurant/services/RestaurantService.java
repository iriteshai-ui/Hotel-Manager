package com.restaurant.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.model.*;
import com.restaurant.repository.OrderRepository;
import com.restaurant.repository.TableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TableRepository tableRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, MenuItem> menuItems = new ConcurrentHashMap<>();

    public RestaurantService() {
        addMenuItem(new MenuItem("1", "Paneer Tikka", 349, "Starter",
            "Smokey grilled Cottage Cheese marinated in spiced yogurt, served with mint chutney", "/images/paneer_tikka.png"));
        addMenuItem(new MenuItem("2", "Chicken Wings", 399, "Starter",
            "Crispy fried wings tossed in tangy sauce, served with blue cheese dip", "/images/chicken_wings.png"));
        addMenuItem(new MenuItem("3", "Soup of the Day", 199, "Starter",
            "Chef's special soup made with fresh seasonal ingredients, served with toasted sourdough", "/images/gourmet_soup.png"));
        addMenuItem(new MenuItem("4", "Classic Burger", 299, "Main",
            "Juicy gourmet patty with aged cheddar, lettuce, tomato, and truffle aioli in a brioche bun", "/images/classic_burger.png"));
        addMenuItem(new MenuItem("5", "Margherita Pizza", 449, "Main",
            "Artisan thin crust with San Marzano tomato sauce, fresh buffalo mozzarella and basil", "/images/margherita_pizza.png"));
        addMenuItem(new MenuItem("6", "Butter Chicken", 429, "Main",
            "Tender tandoori chicken in a rich, creamy tomato gravy, served with butter naan", "/images/butter_chicken.png"));
        addMenuItem(new MenuItem("7", "Pasta Arrabbiata", 379, "Main",
            "Penne in a spicy San Marzano tomato sauce, finished with parmesan and fresh herbs", "/images/pasta_arrabbiata.png"));
        addMenuItem(new MenuItem("8", "Grilled Salmon", 699, "Main",
            "Atlantic salmon fillet with lemon butter sauce, served with truffle mash and seasonal asparagus", "/images/grilled_salmon.png"));
        addMenuItem(new MenuItem("9", "Loaded Fries", 199, "Side",
            "Crispy golden fries topped with artisan cheese sauce, jalapenos and spring onions", "/images/loaded_fries.png"));
        addMenuItem(new MenuItem("10", "Garlic Bread", 149, "Side",
            "Toasted artisan sourdough with herb butter and roasted garlic, served warm", "/images/garlic_bread.png"));
        addMenuItem(new MenuItem("11", "Gulab Jamun", 179, "Dessert",
            "Soft milk-solid dumplings soaked in saffron-infused rose syrup, served warm", "/images/gulab_jamun.png"));
        addMenuItem(new MenuItem("12", "Chocolate Lava Cake", 249, "Dessert",
            "Decadent chocolate cake with molten center, served with Madagascan vanilla ice cream", "/images/lava_cake.png"));
        addMenuItem(new MenuItem("13", "Fresh Lime Soda", 99, "Drink",
            "Refreshing artisanal lime soda with fresh mint and a hint of Himalayan pink salt", "/images/lime_soda.png"));
        addMenuItem(new MenuItem("14", "Mango Lassi", 149, "Drink",
            "Premium Alfonso mango yogurt smoothie with cardamom and crushed pistachios", "/images/mango_lassi.png"));
        addMenuItem(new MenuItem("15", "Cold Coffee", 199, "Drink",
            "Rich espresso blended with chilled milk and topped with artisanal chocolate shavings", "/images/cold_coffee.png"));
    }

    public void seedTables() {
        if (tableRepository.count() == 0) {
            for (int i = 1; i <= 10; i++) {
                tableRepository.save(new RestaurantTable(i));
            }
        }
    }

    public List<MenuItem> getMenu() {
        return new ArrayList<>(menuItems.values());
    }

    public void addMenuItem(MenuItem item) {
        menuItems.put(item.getId(), item);
    }

    public Order placeOrder(int tableNumber, List<OrderItem> items) {
        String id = UUID.randomUUID().toString();
        double total = items.stream().mapToDouble(i -> i.getPrice() * i.getQuantity()).sum();
        LocalDateTime now = LocalDateTime.now();

        OrderEntity entity = new OrderEntity();
        entity.setId(id);
        entity.setTableNumber(tableNumber);
        entity.setTotalPrice(total);
        entity.setStatus(OrderStatus.PLACED);
        entity.setTimestamp(now);
        try {
            entity.setItemsJson(objectMapper.writeValueAsString(items));
        } catch (JsonProcessingException e) {
            entity.setItemsJson("[]");
        }
        orderRepository.save(entity);

        tableRepository.findByNumber(tableNumber).ifPresent(t -> {
            t.setStatus("OCCUPIED");
            t.setCurrentOrderId(id);
            tableRepository.save(t);
        });

        return entityToOrder(entity, items);
    }

    public Order getOrder(String orderId) {
        return orderRepository.findById(orderId).map(e -> entityToOrder(e, parseItems(e))).orElse(null);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll().stream().map(e -> entityToOrder(e, parseItems(e))).collect(Collectors.toList());
    }

    public List<Order> getActiveOrders() {
        return orderRepository.findByStatusNot(OrderStatus.PAID).stream()
            .map(e -> entityToOrder(e, parseItems(e))).collect(Collectors.toList());
    }

    public Order updateOrderStatus(String orderId, OrderStatus status) {
        return orderRepository.findById(orderId).map(e -> {
            e.setStatus(status);
            orderRepository.save(e);
            if (status == OrderStatus.PAID || status == OrderStatus.SERVED) {
                tableRepository.findByNumber(e.getTableNumber()).ifPresent(t -> {
                    if (status == OrderStatus.PAID) {
                        t.setStatus("AVAILABLE");
                        t.setCurrentOrderId(null);
                        tableRepository.save(t);
                    }
                });
            }
            return entityToOrder(e, parseItems(e));
        }).orElse(null);
    }

    private List<OrderItem> parseItems(OrderEntity e) {
        try {
            return objectMapper.readValue(e.getItemsJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private Order entityToOrder(OrderEntity e, List<OrderItem> items) {
        Order o = new Order();
        o.setId(e.getId());
        o.setTableNumber(e.getTableNumber());
        o.setItems(items);
        o.setTotalPrice(e.getTotalPrice());
        o.setStatus(e.getStatus());
        o.setTimestamp(e.getTimestamp());
        return o;
    }
}
