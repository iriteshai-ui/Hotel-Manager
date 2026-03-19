package com.restaurant.controller;

import com.restaurant.model.User;
import com.restaurant.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        Optional<String> token = authService.login(username, password);
        if (token.isPresent()) {
            Optional<User> user = authService.getUserByToken(token.get());
            return ResponseEntity.ok(Map.of(
                "token", token.get(),
                "role", user.get().getRole().name(),
                "username", user.get().getUsername()
            ));
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        authService.logout(token);
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        return authService.getUserByToken(token)
            .map(u -> ResponseEntity.ok(Map.of("username", u.getUsername(), "role", u.getRole().name())))
            .orElse(ResponseEntity.status(401).build());
    }
}
