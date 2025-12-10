package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class RoomTypeUpdateRequest {
    @NotBlank
    private String name;
    
    @NotNull
    @Positive
    private BigDecimal basePrice;
    
    @NotNull
    @Positive
    private Integer capacity;
    
    private String description;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}