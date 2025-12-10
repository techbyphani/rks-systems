package com.hotel.dto;

import lombok.Data;

@Data
public class RoomStatusUpdateRequest {
    private String status;
    private String notes;
}

