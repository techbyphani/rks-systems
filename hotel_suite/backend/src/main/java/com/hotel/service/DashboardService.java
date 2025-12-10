package com.hotel.service;

import com.hotel.dto.DashboardStatsResponse;
import com.hotel.entity.Room;
import com.hotel.entity.RoomBooking;
import com.hotel.repository.RoomBookingRepository;
import com.hotel.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    @Autowired
    private RoomBookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    public DashboardStatsResponse getStats() {
        Long totalBookings = bookingRepository.count();
        Long checkedIn = bookingRepository.countByStatus(RoomBooking.BookingStatus.checked_in);
        Long pendingCheckout = checkedIn; // Same as checked-in guests
        Long availableRooms = (long) roomRepository.findByStatus(Room.RoomStatus.available).size();
        Long occupiedRooms = (long) roomRepository.findByStatus(Room.RoomStatus.occupied).size();
        Long dirtyRooms = (long) roomRepository.findByStatus(Room.RoomStatus.dirty).size();
        Long maintenanceRooms = (long) roomRepository.findByStatus(Room.RoomStatus.maintenance).size();
        Long reservedRooms = (long) roomRepository.findByStatus(Room.RoomStatus.reserved).size();

        return new DashboardStatsResponse(
                totalBookings,
                checkedIn,
                pendingCheckout,
                availableRooms,
                occupiedRooms,
                dirtyRooms + maintenanceRooms + reservedRooms // Total unavailable
        );
    }
}

