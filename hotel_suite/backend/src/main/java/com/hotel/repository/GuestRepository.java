package com.hotel.repository;

import com.hotel.entity.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {
    Optional<Guest> findByPhone(String phone);
    Optional<Guest> findByEmail(String email);
}

