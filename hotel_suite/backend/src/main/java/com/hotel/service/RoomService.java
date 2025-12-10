package com.hotel.service;

import com.hotel.dto.RoomRequest;
import com.hotel.dto.RoomStatusUpdateRequest;
import com.hotel.entity.Room;
import com.hotel.entity.RoomType;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.RoomTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    public List<Room> getAllRooms(String search) {
        List<Room> rooms = roomRepository.findAll();
        
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.toLowerCase();
            rooms = rooms.stream()
                    .filter(r -> r.getRoomNumber().toLowerCase().contains(searchLower) ||
                               r.getRoomType().getName().toLowerCase().contains(searchLower))
                    .toList();
        }
        
        return rooms;
    }

    public Optional<Room> getRoomById(Long id) {
        return roomRepository.findById(id);
    }
    
    public Room createRoom(RoomRequest request) {
        // Check if room number already exists
        if (roomRepository.findByRoomNumber(request.getRoomNumber()).isPresent()) {
            throw new RuntimeException("Room number already exists");
        }
        
        RoomType roomType = roomTypeRepository.findById(request.getRoomTypeId())
                .orElseThrow(() -> new RuntimeException("Room type not found"));
        
        Room room = new Room();
        room.setRoomNumber(request.getRoomNumber());
        room.setRoomType(roomType);
        room.setFloor(request.getFloor());
        room.setDescription(request.getDescription());
        room.setStatus(Room.RoomStatus.available);
        
        return roomRepository.save(room);
    }
    
    public List<Room> getAvailableRooms(LocalDate checkIn, LocalDate checkOut, Long roomTypeId) {
        List<Room> rooms = roomRepository.findByStatus(Room.RoomStatus.available);
        
        if (roomTypeId != null) {
            rooms = rooms.stream()
                    .filter(room -> room.getRoomType().getId().equals(roomTypeId))
                    .toList();
        }
        
        return rooms;
    }
    
    public List<Room> getRoomsByStatus(String status) {
        try {
            Room.RoomStatus roomStatus = Room.RoomStatus.valueOf(status.toLowerCase());
            return roomRepository.findByStatus(roomStatus);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid room status: " + status);
        }
    }

    public Room updateRoomStatus(Long roomId, RoomStatusUpdateRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (request.getStatus() != null) {
            try {
                Room.RoomStatus newStatus = Room.RoomStatus.valueOf(request.getStatus().toLowerCase());
                room.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid room status: " + request.getStatus());
            }
        }

        return roomRepository.save(room);
    }

    public List<RoomType> getAllRoomTypes() {
        return roomTypeRepository.findAll();
    }
    
    public RoomType getRoomTypeById(Long id) {
        return roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room type not found"));
    }
    
    public RoomType updateRoomType(Long id, com.hotel.dto.RoomTypeUpdateRequest request) {
        RoomType roomType = roomTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room type not found"));
        
        roomType.setName(request.getName());
        roomType.setBasePrice(request.getBasePrice());
        roomType.setCapacity(request.getCapacity());
        roomType.setDescription(request.getDescription());
        
        return roomTypeRepository.save(roomType);
    }
}

