package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuestRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    private String email;
    private String idProofType;
    private String idProofNumber;
    private String address;
}

