package com.hotel.controller;

import com.hotel.service.OfferService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/offers")
public class OfferController {

    @Autowired
    private OfferService offerService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getActiveOffers() {
        List<Map<String, Object>> offers = offerService.getActiveOffers();
        return ResponseEntity.ok(offers);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOffer(@RequestBody Map<String, Object> offerData) {
        Map<String, Object> offer = offerService.createOffer(offerData);
        return ResponseEntity.ok(offer);
    }
}

