package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequest {
    @NotBlank(message = "Guest name is required")
    private String guestName;

    @NotBlank(message = "Guest phone is required")
    private String guestPhone;

    @NotNull(message = "Room type ID is required")
    private Long roomTypeId;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    private LocalDate checkOutDate;

    private Integer adults = 1;
    private Integer children = 0;
    private String bookingSource = "website";
}

