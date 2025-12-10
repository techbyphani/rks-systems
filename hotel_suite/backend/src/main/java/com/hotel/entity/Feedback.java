package com.hotel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @ManyToOne
    @JoinColumn(name = "room_booking_id")
    private RoomBooking roomBooking;

    @Column(name = "room_rating")
    private Integer roomRating;

    @Column(name = "service_rating")
    private Integer serviceRating;

    @Column(name = "overall_rating")
    private Integer overallRating;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "feedback_type", length = 20)
    @Enumerated(EnumType.STRING)
    private FeedbackType feedbackType = FeedbackType.checkout;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (feedbackType == null) {
            feedbackType = FeedbackType.checkout;
        }
    }

    public enum FeedbackType {
        checkout, general
    }
}

