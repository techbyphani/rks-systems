package com.hotel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalBookings;
    private Long checkedIn;
    private Long pendingCheckout;
    private Long availableRooms;
    private Long occupiedRooms;
    private Long dirtyRooms;
}

