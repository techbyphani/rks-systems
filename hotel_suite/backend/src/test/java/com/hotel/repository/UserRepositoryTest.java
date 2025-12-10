package com.hotel.repository;

import com.hotel.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUsername_Success() {
        User user = new User();
        user.setUsername("testuser");
        user.setPasswordHash("hashedPassword");
        user.setRole(User.Role.admin);

        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByUsername("testuser");

        assertTrue(found.isPresent());
        assertEquals("testuser", found.get().getUsername());
        assertEquals(User.Role.admin, found.get().getRole());
    }

    @Test
    void findByUsername_NotFound() {
        Optional<User> found = userRepository.findByUsername("nonexistent");

        assertFalse(found.isPresent());
    }

    @Test
    void existsByUsername_True() {
        User user = new User();
        user.setUsername("existinguser");
        user.setPasswordHash("hashedPassword");
        user.setRole(User.Role.reception);

        entityManager.persistAndFlush(user);

        boolean exists = userRepository.existsByUsername("existinguser");

        assertTrue(exists);
    }

    @Test
    void existsByUsername_False() {
        boolean exists = userRepository.existsByUsername("nonexistent");

        assertFalse(exists);
    }
}