package com.hotel.repository;

import com.hotel.entity.RoomBooking;
import com.hotel.entity.RoomBooking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {
    Optional<RoomBooking> findByBookingId(String bookingId);
    List<RoomBooking> findByStatus(BookingStatus status);
    List<RoomBooking> findByCheckInDate(LocalDate date);
    List<RoomBooking> findByCheckOutDate(LocalDate date);
    
    @Query("SELECT COUNT(rb) FROM RoomBooking rb WHERE rb.status = :status")
    Long countByStatus(@Param("status") BookingStatus status);
    
    List<RoomBooking> findByGuestId(Long guestId);
    List<RoomBooking> findByCheckInDateAndStatus(LocalDate checkInDate, BookingStatus status);
    List<RoomBooking> findByCheckOutDateAndStatus(LocalDate checkOutDate, BookingStatus status);
}

