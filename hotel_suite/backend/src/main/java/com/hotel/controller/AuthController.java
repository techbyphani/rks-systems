package com.hotel.controller;

import com.hotel.dto.LoginRequest;
import com.hotel.dto.LoginResponse;
import com.hotel.dto.RegisterRequest;
import com.hotel.entity.User;
import com.hotel.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException | UsernameNotFoundException e) {
            logger.warn("Login attempt failed for username: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "UNAUTHORIZED", "message", "Invalid credentials"));
        } catch (Exception e) {
            logger.error("Unexpected error during login for username: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "An unexpected error occurred"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, Authentication authentication) {
        try {
            // Check if user is admin (this should be done via @PreAuthorize in production)
            User user = authService.register(request);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "User created successfully");
            response.put("user_id", user.getId());
            logger.info("User registered successfully: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            logger.warn("Registration failed for username: {} - {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during registration for username: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "An unexpected error occurred"));
        }
    }
}

