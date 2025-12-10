package com.hotel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@AllArgsConstructor
public class ErrorResponse {
    private String error;
    private String message;
    private Map<String, String> details;
    private LocalDateTime timestamp;
}

