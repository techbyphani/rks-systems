package com.hotel.service;

import com.hotel.dto.LoginRequest;
import com.hotel.dto.LoginResponse;
import com.hotel.dto.RegisterRequest;
import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import com.hotel.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private LoginRequest loginRequest;
    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("admin");
        testUser.setPasswordHash("hashedPassword");
        testUser.setRole(User.Role.admin);

        loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password");

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setPassword("password");
        registerRequest.setRole("reception");
    }

    @Test
    void login_Success() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateToken("admin", "admin")).thenReturn("jwt-token");

        LoginResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("admin", response.getRole());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByUsername("admin");
        verify(jwtUtil).generateToken("admin", "admin");
    }

    @Test
    void register_Success() {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User result = authService.register(registerRequest);

        assertNotNull(result);
        assertEquals(testUser.getId(), result.getId());

        verify(userRepository).existsByUsername("newuser");
        verify(passwordEncoder).encode("password");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_UserAlreadyExists() {
        when(userRepository.existsByUsername("newuser")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.register(registerRequest);
        });

        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository).existsByUsername("newuser");
        verify(userRepository, never()).save(any(User.class));
    }
}