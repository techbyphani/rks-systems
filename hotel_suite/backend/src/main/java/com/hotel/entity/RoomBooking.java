package com.hotel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "room_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String bookingId;

    @ManyToOne
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private LocalDate checkOutDate;

    @Column(name = "actual_check_in")
    private LocalDateTime actualCheckIn;

    @Column(name = "actual_check_out")
    private LocalDateTime actualCheckOut;

    @Column(nullable = false)
    private Integer adults = 1;

    @Column(nullable = false)
    private Integer children = 0;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.confirmed;

    @Column(name = "booking_source", length = 20)
    @Enumerated(EnumType.STRING)
    private BookingSource bookingSource = BookingSource.website;

    @OneToMany(mappedBy = "roomBooking", cascade = CascadeType.ALL)
    private List<Bill> bills;

    @OneToMany(mappedBy = "roomBooking")
    private List<Feedback> feedbacks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = BookingStatus.confirmed;
        }
        if (bookingSource == null) {
            bookingSource = BookingSource.website;
        }
        if (adults == null) {
            adults = 1;
        }
        if (children == null) {
            children = 0;
        }
    }

    public enum BookingStatus {
        confirmed, checked_in, checked_out, cancelled
    }

    public enum BookingSource {
        website, phone, walk_in, chatbot
    }
}

