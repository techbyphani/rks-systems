package com.hotel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String billNumber;

    @ManyToOne
    @JoinColumn(name = "room_booking_id", nullable = false)
    private RoomBooking roomBooking;

    @ManyToOne
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @Column(name = "room_charges", precision = 10, scale = 2)
    private BigDecimal roomCharges = BigDecimal.ZERO;

    @Column(name = "food_charges", precision = 10, scale = 2)
    private BigDecimal foodCharges = BigDecimal.ZERO;

    @Column(name = "other_charges", precision = 10, scale = 2)
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_status", length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.pending;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod;
    
    @Column(name = "transaction_id", length = 50)
    private String transactionId;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL)
    private List<BillItem> items;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.pending;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PaymentStatus {
        pending, paid, partial
    }
}

