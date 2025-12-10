package com.hotel.repository;

import com.hotel.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);
    List<Bill> findByRoomBookingId(Long roomBookingId);
    List<Bill> findByGuestId(Long guestId);
}

