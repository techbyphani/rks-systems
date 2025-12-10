package com.hotel.repository;

import com.hotel.entity.Room;
import com.hotel.entity.Room.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);
    List<Room> findByStatus(RoomStatus status);
    List<Room> findByRoomTypeId(Long roomTypeId);
}

