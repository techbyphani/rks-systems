package com.hotel.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class BillRequest {
    @NotNull
    private Long bookingId;
    
    @Positive
    private BigDecimal roomCharges;
    
    private BigDecimal foodCharges = BigDecimal.ZERO;
    private BigDecimal otherCharges = BigDecimal.ZERO;
    private BigDecimal taxAmount = BigDecimal.ZERO;

    // Getters and Setters
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    
    public BigDecimal getRoomCharges() { return roomCharges; }
    public void setRoomCharges(BigDecimal roomCharges) { this.roomCharges = roomCharges; }
    
    public BigDecimal getFoodCharges() { return foodCharges; }
    public void setFoodCharges(BigDecimal foodCharges) { this.foodCharges = foodCharges; }
    
    public BigDecimal getOtherCharges() { return otherCharges; }
    public void setOtherCharges(BigDecimal otherCharges) { this.otherCharges = otherCharges; }
    
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
}