package com.hotel.service;

import com.hotel.dto.GuestRequest;
import com.hotel.entity.Guest;
import com.hotel.entity.RoomBooking;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.RoomBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GuestService {

    @Autowired
    private GuestRepository guestRepository;
    
    @Autowired
    private RoomBookingRepository bookingRepository;

    public List<Guest> getAllGuests(String search) {
        List<Guest> guests = guestRepository.findAll();
        
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            guests = guests.stream()
                    .filter(g -> g.getName().toLowerCase().contains(searchLower) ||
                               g.getPhone().toLowerCase().contains(searchLower) ||
                               (g.getEmail() != null && g.getEmail().toLowerCase().contains(searchLower)))
                    .toList();
        }
        
        return guests;
    }

    public Guest createGuest(GuestRequest request) {
        // Check if guest with same phone already exists
        Optional<Guest> existingGuest = guestRepository.findByPhone(request.getPhone());
        if (existingGuest.isPresent()) {
            throw new RuntimeException("Guest with phone number already exists");
        }

        Guest guest = new Guest();
        guest.setName(request.getName());
        guest.setPhone(request.getPhone());
        guest.setEmail(request.getEmail());
        guest.setIdProofType(request.getIdProofType());
        guest.setIdProofNumber(request.getIdProofNumber());
        guest.setAddress(request.getAddress());

        return guestRepository.save(guest);
    }

    public Optional<Guest> getGuestById(Long id) {
        return guestRepository.findById(id);
    }
    
    public List<RoomBooking> getGuestBookings(Long guestId) {
        return bookingRepository.findByGuestId(guestId);
    }
}

