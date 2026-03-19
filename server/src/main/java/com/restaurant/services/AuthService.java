package com.restaurant.services;

import com.restaurant.model.User;
import com.restaurant.model.UserRole;
import com.restaurant.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private final Map<String, User> tokenStore = new ConcurrentHashMap<>();

    public void seedUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(new User("admin", "admin123", UserRole.MANAGER));
            userRepository.save(new User("waiter", "waiter123", UserRole.WAITER));
            userRepository.save(new User("kitchen", "kitchen123", UserRole.KITCHEN));
        }
    }

    public Optional<String> login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            String token = UUID.randomUUID().toString();
            tokenStore.put(token, userOpt.get());
            return Optional.of(token);
        }
        return Optional.empty();
    }

    public Optional<User> getUserByToken(String token) {
        if (token == null) return Optional.empty();
        return Optional.ofNullable(tokenStore.get(token));
    }

    public void logout(String token) {
        tokenStore.remove(token);
    }
}
