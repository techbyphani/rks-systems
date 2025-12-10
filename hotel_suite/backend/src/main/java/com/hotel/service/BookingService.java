package com.hotel.service;

import com.hotel.dto.BookingRequest;
import com.hotel.entity.*;
import com.hotel.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {

    @Autowired
    private RoomBookingRepository bookingRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    public List<RoomBooking> getAllBookings(String status, LocalDate date, Integer limit, String search) {
        List<RoomBooking> bookings = bookingRepository.findAll();
        
        if (status != null) {
            bookings = bookings.stream()
                    .filter(b -> b.getStatus().name().equalsIgnoreCase(status))
                    .toList();
        }
        
        if (date != null) {
            bookings = bookings.stream()
                    .filter(b -> b.getCheckInDate().equals(date) || b.getCheckOutDate().equals(date))
                    .toList();
        }
        
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            bookings = bookings.stream()
                    .filter(b -> b.getBookingId().toLowerCase().contains(searchLower) ||
                               b.getGuest().getName().toLowerCase().contains(searchLower) ||
                               b.getGuest().getPhone().toLowerCase().contains(searchLower))
                    .toList();
        }
        
        if (limit != null && limit > 0) {
            bookings = bookings.stream().limit(limit).toList();
        }
        
        return bookings;
    }

    @Transactional
    public RoomBooking createBooking(BookingRequest request) {
        // Validate dates
        if (request.getCheckOutDate().isBefore(request.getCheckInDate()) || 
            request.getCheckOutDate().isEqual(request.getCheckInDate())) {
            throw new RuntimeException("Check-out date must be after check-in date");
        }

        // Find or create guest
        Guest guest = guestRepository.findByPhone(request.getGuestPhone())
                .orElseGet(() -> {
                    Guest newGuest = new Guest();
                    newGuest.setName(request.getGuestName());
                    newGuest.setPhone(request.getGuestPhone());
                    return guestRepository.save(newGuest);
                });

        // Find available room of the requested type
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new RuntimeException("Room type not found"));

        Room availableRoom = roomRepository.findByRoomTypeId(request.getRoomTypeId()).stream()
                .filter(r -> r.getStatus() == Room.RoomStatus.available)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No available rooms of this type"));

        // Validate capacity
        int totalGuests = request.getAdults() + (request.getChildren() != null ? request.getChildren() : 0);
        if (totalGuests > roomType.getCapacity()) {
            throw new RuntimeException("Total guests exceed room capacity");
        }

        // Create booking
        RoomBooking booking = new RoomBooking();
        booking.setBookingId("BK" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setGuest(guest);
        booking.setRoom(availableRoom);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setAdults(request.getAdults() != null ? request.getAdults() : 1);
        booking.setChildren(request.getChildren() != null ? request.getChildren() : 0);
        booking.setStatus(RoomBooking.BookingStatus.confirmed);
        
        try {
            booking.setBookingSource(RoomBooking.BookingSource.valueOf(
                    request.getBookingSource() != null ? request.getBookingSource().toLowerCase() : "website"));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid booking source: " + request.getBookingSource());
        }

        // Calculate total amount
        long nights = java.time.temporal.ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        if (nights <= 0) {
            throw new RuntimeException("Invalid booking duration");
        }
        BigDecimal totalAmount = roomType.getBasePrice().multiply(BigDecimal.valueOf(nights));
        booking.setTotalAmount(totalAmount);

        // Update room status
        availableRoom.setStatus(Room.RoomStatus.reserved);
        roomRepository.save(availableRoom);

        return bookingRepository.save(booking);
    }

    @Transactional
    public RoomBooking checkIn(Long bookingId) {
        RoomBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Validate booking status
        if (booking.getStatus() != RoomBooking.BookingStatus.confirmed) {
            throw new RuntimeException("Booking must be confirmed to check-in");
        }

        // Validate check-in date
        if (LocalDate.now().isBefore(booking.getCheckInDate())) {
            throw new RuntimeException("Cannot check-in before scheduled date");
        }

        booking.setStatus(RoomBooking.BookingStatus.checked_in);
        booking.setActualCheckIn(LocalDateTime.now());

        Room room = booking.getRoom();
        room.setStatus(Room.RoomStatus.occupied);
        roomRepository.save(room);

        return bookingRepository.save(booking);
    }

    @Transactional
    public RoomBooking checkOut(Long bookingId) {
        RoomBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Validate booking status
        if (booking.getStatus() != RoomBooking.BookingStatus.checked_in) {
            throw new RuntimeException("Guest must be checked-in to check-out");
        }

        booking.setStatus(RoomBooking.BookingStatus.checked_out);
        booking.setActualCheckOut(LocalDateTime.now());

        Room room = booking.getRoom();
        room.setStatus(Room.RoomStatus.dirty);
        roomRepository.save(room);

        return bookingRepository.save(booking);
    }

    public RoomBooking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }
    
    @Transactional
    public RoomBooking updateBooking(Long bookingId, BookingRequest request) {
        RoomBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() == RoomBooking.BookingStatus.checked_in || 
            booking.getStatus() == RoomBooking.BookingStatus.checked_out) {
            throw new RuntimeException("Cannot update booking after check-in");
        }
        
        // Update guest info if provided
        Guest guest = booking.getGuest();
        if (request.getGuestName() != null) {
            guest.setName(request.getGuestName());
        }
        if (request.getGuestPhone() != null) {
            guest.setPhone(request.getGuestPhone());
        }
        guestRepository.save(guest);
        
        // Update booking details
        if (request.getCheckInDate() != null) {
            booking.setCheckInDate(request.getCheckInDate());
        }
        if (request.getCheckOutDate() != null) {
            booking.setCheckOutDate(request.getCheckOutDate());
        }
        if (request.getAdults() != null) {
            booking.setAdults(request.getAdults());
        }
        if (request.getChildren() != null) {
            booking.setChildren(request.getChildren());
        }
        
        return bookingRepository.save(booking);
    }
    
    @Transactional
    public void cancelBooking(Long bookingId) {
        RoomBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (booking.getStatus() == RoomBooking.BookingStatus.checked_in) {
            throw new RuntimeException("Cannot cancel booking after check-in");
        }
        
        booking.setStatus(RoomBooking.BookingStatus.cancelled);
        
        // Free up the room if it was reserved
        Room room = booking.getRoom();
        if (room.getStatus() == Room.RoomStatus.reserved) {
            room.setStatus(Room.RoomStatus.available);
            roomRepository.save(room);
        }
        
        bookingRepository.save(booking);
    }
    
    public List<RoomBooking> getTodayArrivals() {
        return bookingRepository.findByCheckInDateAndStatus(LocalDate.now(), RoomBooking.BookingStatus.confirmed);
    }
    
    public List<RoomBooking> getTodayDepartures() {
        return bookingRepository.findByCheckOutDateAndStatus(LocalDate.now(), RoomBooking.BookingStatus.checked_in);
    }
}

