package com.hotel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 10)
    private String roomNumber;

    @ManyToOne
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private RoomStatus status = RoomStatus.available;

    private Integer floor;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    private List<RoomImage> images;

    @OneToMany(mappedBy = "room")
    private List<RoomBooking> bookings;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = RoomStatus.available;
        }
    }

    public enum RoomStatus {
        available, occupied, reserved, maintenance, dirty
    }
}

