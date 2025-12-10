package com.hotel.controller;

import com.hotel.dto.RoomRequest;
import com.hotel.dto.RoomStatusUpdateRequest;
import com.hotel.entity.Room;
import com.hotel.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms(@RequestParam(required = false) String search) {
        List<Room> rooms = roomService.getAllRooms(search);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoomById(@PathVariable Long roomId) {
        Optional<Room> room = roomService.getRoomById(roomId);
        if (room.isPresent()) {
            return ResponseEntity.ok(room.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NOT_FOUND", "message", "Room not found"));
    }

    @PostMapping
    public ResponseEntity<?> createRoom(@Valid @RequestBody RoomRequest request) {
        try {
            Room room = roomService.createRoom(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(room);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<List<Room>> getAvailableRooms(
            @RequestParam(required = false) LocalDate checkIn,
            @RequestParam(required = false) LocalDate checkOut,
            @RequestParam(required = false) Long roomTypeId) {
        List<Room> rooms = roomService.getAvailableRooms(checkIn, checkOut, roomTypeId);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Room>> getRoomsByStatus(@PathVariable String status) {
        List<Room> rooms = roomService.getRoomsByStatus(status);
        return ResponseEntity.ok(rooms);
    }

    @PutMapping("/{roomId}/status")
    public ResponseEntity<?> updateRoomStatus(
            @PathVariable Long roomId,
            @RequestBody RoomStatusUpdateRequest request) {
        try {
            Room room = roomService.updateRoomStatus(roomId, request);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }
}

