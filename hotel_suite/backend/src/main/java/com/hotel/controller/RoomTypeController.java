package com.hotel.controller;

import com.hotel.dto.RoomTypeUpdateRequest;
import com.hotel.entity.RoomType;
import com.hotel.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/room-types")
public class RoomTypeController {

    @Autowired
    private RoomService roomService;

    @GetMapping
    public ResponseEntity<List<RoomType>> getAllRoomTypes() {
        List<RoomType> roomTypes = roomService.getAllRoomTypes();
        return ResponseEntity.ok(roomTypes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRoomTypeById(@PathVariable Long id) {
        try {
            RoomType roomType = roomService.getRoomTypeById(id);
            return ResponseEntity.ok(roomType);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRoomType(@PathVariable Long id, 
                                          @Valid @RequestBody RoomTypeUpdateRequest request) {
        try {
            RoomType roomType = roomService.updateRoomType(id, request);
            return ResponseEntity.ok(roomType);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }
}