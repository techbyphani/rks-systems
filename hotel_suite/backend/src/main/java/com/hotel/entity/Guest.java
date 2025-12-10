package com.hotel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "guests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Guest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(name = "id_proof_type", length = 50)
    private String idProofType;

    @Column(name = "id_proof_number", length = 50)
    private String idProofNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    @OneToMany(mappedBy = "guest")
    private List<RoomBooking> bookings;

    @OneToMany(mappedBy = "guest")
    private List<Bill> bills;

    @OneToMany(mappedBy = "guest")
    private List<Feedback> feedbacks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

