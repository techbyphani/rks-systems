package com.hotel.controller;

import com.hotel.dto.BookingRequest;
import com.hotel.entity.RoomBooking;
import com.hotel.service.BookingService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<RoomBooking>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String search) {
        List<RoomBooking> bookings = bookingService.getAllBookings(status, date, limit, search);
        return ResponseEntity.ok(bookings);
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest request) {
        try {
            RoomBooking booking = bookingService.createBooking(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(booking);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}/checkin")
    public ResponseEntity<?> checkIn(@PathVariable Long bookingId) {
        try {
            RoomBooking booking = bookingService.checkIn(bookingId);
            logger.info("Check-in successful for booking ID: {}", bookingId);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            logger.warn("Check-in failed for booking ID: {} - {}", bookingId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during check-in for booking ID: {}", bookingId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "An unexpected error occurred"));
        }
    }

    @PutMapping("/{bookingId}/checkout")
    public ResponseEntity<?> checkOut(@PathVariable Long bookingId) {
        try {
            RoomBooking booking = bookingService.checkOut(bookingId);
            logger.info("Check-out successful for booking ID: {}", bookingId);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            logger.warn("Check-out failed for booking ID: {} - {}", bookingId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error during check-out for booking ID: {}", bookingId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "An unexpected error occurred"));
        }
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBookingById(@PathVariable Long bookingId) {
        try {
            RoomBooking booking = bookingService.getBookingById(bookingId);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<?> updateBooking(@PathVariable Long bookingId, 
                                         @Valid @RequestBody BookingRequest request) {
        try {
            RoomBooking booking = bookingService.updateBooking(bookingId, request);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long bookingId) {
        try {
            bookingService.cancelBooking(bookingId);
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }

    @GetMapping("/today/arrivals")
    public ResponseEntity<List<RoomBooking>> getTodayArrivals() {
        List<RoomBooking> arrivals = bookingService.getTodayArrivals();
        return ResponseEntity.ok(arrivals);
    }

    @GetMapping("/today/departures")
    public ResponseEntity<List<RoomBooking>> getTodayDepartures() {
        List<RoomBooking> departures = bookingService.getTodayDepartures();
        return ResponseEntity.ok(departures);
    }
}

