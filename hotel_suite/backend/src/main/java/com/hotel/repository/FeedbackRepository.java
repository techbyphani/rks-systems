package com.hotel.repository;

import com.hotel.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByGuestId(Long guestId);
    List<Feedback> findByRoomBookingId(Long roomBookingId);
}

