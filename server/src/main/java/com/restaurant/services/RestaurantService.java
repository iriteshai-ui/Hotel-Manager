package com.restaurant.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.restaurant.model.MenuItem;
import com.restaurant.model.Order;
import com.restaurant.model.OrderItem;
import com.restaurant.model.OrderStatus;

@Service
public class RestaurantService {

    // In-memory storage acting as a database
    private final Map<String, MenuItem> menuItems = new ConcurrentHashMap<>();
    private final Map<String, Order> orders = new ConcurrentHashMap<>();

    public RestaurantService() {
        //starters
        addMenuItem(new MenuItem("1", "Paneer Tikka", 349, "Starter",
        "Smokey grilled Cottage Cheese marinated in spiced yogurt, served with mint chutney",
        "/images/paneer_tikka.png"));

        addMenuItem(new MenuItem("2", "Chicken Wings", 399, "Starter",
        "Crispy fried wings tossed in tangy sauce, served with blue cheese dip",
        "/images/chicken_wings.png"));

        addMenuItem(new MenuItem("3", "Soup of the Day", 199, "Starter",
        "Chef's special soup made with fresh seasonal ingredients, served with toasted sourdough",
        "/images/gourmet_soup.png"));

        //mains
        addMenuItem(new MenuItem("4", "Classic Burger", 299, "Main",
        "Juicy gourmet patty with aged cheddar, lettuce, tomato, and truffle aioli in a brioche bun",
        "/images/classic_burger.png"));

        addMenuItem(new MenuItem("5", "Margherita Pizza", 449, "Main",
        "Artisan thin crust with San Marzano tomato sauce, fresh buffalo mozzarella and basil",
        "/images/margherita_pizza.png"));

        addMenuItem(new MenuItem("6", "Butter Chicken", 429, "Main",
        "Tender tandoori chicken in a rich, creamy tomato gravy, served with butter naan",
        "/images/butter_chicken.png"));

        addMenuItem(new MenuItem("7", "Pasta Arrabbiata", 379, "Main",
        "Penne in a spicy San Marzano tomato sauce, finished with parmesan and fresh herbs",
        "/images/pasta_arrabbiata.png"));

        addMenuItem(new MenuItem("8", "Grilled Salmon", 699, "Main",
        "Atlantic salmon fillet with lemon butter sauce, served with truffle mash and seasonal asparagus",
        "/images/grilled_salmon.png"));

        //sides
        addMenuItem(new MenuItem("9", "Loaded Fries", 199, "Side",
        "Crispy golden fries topped with artisan cheese sauce, jalapenos and spring onions",
        "/images/loaded_fries.png"));

        addMenuItem(new MenuItem("10", "Garlic Bread", 149, "Side",
        "Toasted artisan sourdough with herb butter and roasted garlic, served warm",
        "/images/garlic_bread.png"));

        //Desserts
        addMenuItem(new MenuItem("11", "Gulab Jamun", 179, "Dessert",
        "Soft milk-solid dumplings soaked in saffron-infused rose syrup, served warm",
        "/images/gulab_jamun.png"));

        addMenuItem(new MenuItem("12", "Chocolate Lava Cake", 249, "Dessert",
        "Decadent chocolate cake with molten center, served with Madagascan vanilla ice cream",
        "/images/lava_cake.png"));

        //Drinks
        addMenuItem(new MenuItem("13", "Fresh Lime Soda", 99, "Drink",
        "Refreshing artisanal lime soda with fresh mint and a hint of Himalayan pink salt",
        "/images/lime_soda.png"));

        addMenuItem(new MenuItem("14", "Mango Lassi", 149, "Drink",
        "Premium Alfonso mango yogurt smoothie with cardamom and crushed pistachios",
        "/images/mango_lassi.png"));

        addMenuItem(new MenuItem("15", "Cold Coffee", 199, "Drink",
        "Rich espresso blended with chilled milk and topped with artisanal chocolate shavings",
        "/images/cold_coffee.png"));
    }

    public List<MenuItem> getMenu() {
        return new ArrayList<>(menuItems.values());
    }

    public MenuItem getMenuItem(String id) {
        return menuItems.get(id);
    }

    public void addMenuItem(MenuItem item) {
        menuItems.put(item.getId(), item);
    }

    public Order placeOrder(int tableNumber, List<OrderItem> items) {
        Order order = new Order(tableNumber, items);
        orders.put(order.getId(), order);
        return order;
    }

    public Order getOrder(String orderId) {
        return orders.get(orderId);
    }

    public List<Order> getAllOrders() {
        return new ArrayList<>(orders.values());
    }

    public List<Order> getActiveOrders() {
        return orders.values().stream()
                .filter(o -> o.getStatus() != OrderStatus.PAID)
                .collect(Collectors.toList());
    }

    public Order updateOrderStatus(String orderId, OrderStatus status) {
        System.out.println("Updating order status: ID=" + orderId + ", New Status=" + status);
        Order order = orders.get(orderId);
        if (order != null) {
            order.setStatus(status);
            System.out.println("Successfully updated order " + orderId + " to " + status);
        } else {
            System.out.println("Order NOT FOUND: " + orderId);
        }
        return order;
    }

    public String generateTableQRUrl(int tableNumber, String baseUrl) {
        // baseurl should something be like "http://192.168.1.100:5173" (FE url)
        return baseUrl + "/menu?table=" + tableNumber;
    }
}
