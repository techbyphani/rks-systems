package com.hotel.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OfferService {

    // Placeholder for offers - can be extended with database table later
    public List<Map<String, Object>> getActiveOffers() {
        return new ArrayList<>();
    }

    public Map<String, Object> createOffer(Map<String, Object> offerData) {
        // Placeholder implementation
        return offerData;
    }
}

