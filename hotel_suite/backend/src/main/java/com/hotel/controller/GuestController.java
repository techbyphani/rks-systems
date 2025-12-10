package com.hotel.controller;

import com.hotel.entity.Guest;
import com.hotel.entity.RoomBooking;
import com.hotel.service.GuestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/guests")
public class GuestController {

    @Autowired
    private GuestService guestService;

    @GetMapping
    public ResponseEntity<List<Guest>> getAllGuests(@RequestParam(required = false) String search) {
        List<Guest> guests = guestService.getAllGuests(search);
        return ResponseEntity.ok(guests);
    }

    @GetMapping("/{guestId}")
    public ResponseEntity<?> getGuestById(@PathVariable Long guestId) {
        Optional<Guest> guest = guestService.getGuestById(guestId);
        if (guest.isPresent()) {
            return ResponseEntity.ok(guest.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NOT_FOUND", "message", "Guest not found"));
    }

    @GetMapping("/{guestId}/bookings")
    public ResponseEntity<List<RoomBooking>> getGuestBookings(@PathVariable Long guestId) {
        List<RoomBooking> bookings = guestService.getGuestBookings(guestId);
        return ResponseEntity.ok(bookings);
    }
}

