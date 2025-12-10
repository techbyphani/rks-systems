package com.hotel.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackRequest {
    @NotNull(message = "Guest ID is required")
    private Long guestId;

    private Long roomBookingId;
    private Integer roomRating;
    private Integer serviceRating;
    private Integer overallRating;
    private String comments;
}

