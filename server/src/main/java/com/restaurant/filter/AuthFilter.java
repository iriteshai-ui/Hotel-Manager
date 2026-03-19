package com.restaurant.filter;

import com.restaurant.services.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class AuthFilter extends OncePerRequestFilter {

    @Autowired
    private AuthService authService;

    private static final Set<String> PUBLIC_PREFIXES = Set.of(
        "/api/auth",
        "/ws",
        "/topic",
        "/app"
    );

    private static final Set<String> PUBLIC_EXACT = Set.of(
        "/api/initial_data"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if (isPublic(path, method)) {
            chain.doFilter(request, response);
            return;
        }

        String token = request.getHeader("X-Auth-Token");
        if (token == null || authService.getUserByToken(token).isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isPublic(String path, String method) {
        if (PUBLIC_EXACT.contains(path)) return true;
        if ("POST".equals(method) && path.equals("/api/orders")) return true;
        for (String prefix : PUBLIC_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }
        if (!path.startsWith("/api")) return true;
        return false;
    }
}
