package com.hotel.service;

import com.hotel.dto.FeedbackRequest;
import com.hotel.entity.Feedback;
import com.hotel.entity.Guest;
import com.hotel.entity.RoomBooking;
import com.hotel.repository.FeedbackRepository;
import com.hotel.repository.GuestRepository;
import com.hotel.repository.RoomBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private RoomBookingRepository roomBookingRepository;

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public Feedback createFeedback(FeedbackRequest request) {
        Guest guest = guestRepository.findById(request.getGuestId())
                .orElseThrow(() -> new RuntimeException("Guest not found"));

        // Validate ratings (1-5 scale)
        validateRating(request.getRoomRating(), "Room rating");
        validateRating(request.getServiceRating(), "Service rating");
        validateRating(request.getOverallRating(), "Overall rating");

        Feedback feedback = new Feedback();
        feedback.setGuest(guest);
        feedback.setRoomRating(request.getRoomRating());
        feedback.setServiceRating(request.getServiceRating());
        feedback.setOverallRating(request.getOverallRating());
        feedback.setComments(request.getComments());
        feedback.setFeedbackType(Feedback.FeedbackType.checkout);

        if (request.getRoomBookingId() != null) {
            RoomBooking booking = roomBookingRepository.findById(request.getRoomBookingId())
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            feedback.setRoomBooking(booking);
        }

        return feedbackRepository.save(feedback);
    }

    private void validateRating(Integer rating, String fieldName) {
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new RuntimeException(fieldName + " must be between 1 and 5");
        }
    }

    public Optional<Feedback> getFeedbackById(Long id) {
        return feedbackRepository.findById(id);
    }
}

