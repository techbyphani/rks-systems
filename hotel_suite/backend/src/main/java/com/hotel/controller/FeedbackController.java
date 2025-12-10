package com.hotel.controller;

import com.hotel.dto.FeedbackRequest;
import com.hotel.entity.Feedback;
import com.hotel.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        List<Feedback> feedbacks = feedbackService.getAllFeedback();
        return ResponseEntity.ok(feedbacks);
    }

    @PostMapping
    public ResponseEntity<?> createFeedback(@Valid @RequestBody FeedbackRequest request) {
        try {
            Feedback feedback = feedbackService.createFeedback(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(feedback);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }
}

