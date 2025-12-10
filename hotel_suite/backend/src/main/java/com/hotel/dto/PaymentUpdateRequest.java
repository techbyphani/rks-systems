package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;

public class PaymentUpdateRequest {
    @NotBlank
    private String paymentStatus; // paid, pending, partial
    
    private String paymentMethod; // cash, card, upi
    private String transactionId;

    // Getters and Setters
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
}