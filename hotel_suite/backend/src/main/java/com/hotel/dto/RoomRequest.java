package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class RoomRequest {
    @NotBlank
    private String roomNumber;
    
    @NotNull
    private Long roomTypeId;
    
    @Positive
    private Integer floor;
    
    private String description;

    // Getters and Setters
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    
    public Long getRoomTypeId() { return roomTypeId; }
    public void setRoomTypeId(Long roomTypeId) { this.roomTypeId = roomTypeId; }
    
    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}