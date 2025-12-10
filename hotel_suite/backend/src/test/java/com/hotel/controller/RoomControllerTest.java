package com.hotel.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.dto.RoomStatusUpdateRequest;
import com.hotel.entity.Room;
import com.hotel.entity.RoomType;
import com.hotel.service.RoomService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RoomController.class)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllRooms_Success() throws Exception {
        Room room = createSampleRoom();
        List<Room> rooms = Arrays.asList(room);

        when(roomService.getAllRooms()).thenReturn(rooms);

        mockMvc.perform(get("/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].roomNumber").value("101"))
                .andExpect(jsonPath("$[0].status").value("available"));
    }

    @Test
    void updateRoomStatus_Success() throws Exception {
        RoomStatusUpdateRequest request = new RoomStatusUpdateRequest();
        request.setStatus("maintenance");

        Room room = createSampleRoom();
        room.setStatus(Room.RoomStatus.maintenance);

        when(roomService.updateRoomStatus(anyLong(), any(RoomStatusUpdateRequest.class)))
                .thenReturn(room);

        mockMvc.perform(put("/rooms/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("maintenance"));
    }

    @Test
    void updateRoomStatus_RoomNotFound() throws Exception {
        RoomStatusUpdateRequest request = new RoomStatusUpdateRequest();
        request.setStatus("maintenance");

        when(roomService.updateRoomStatus(anyLong(), any(RoomStatusUpdateRequest.class)))
                .thenThrow(new RuntimeException("Room not found"));

        mockMvc.perform(put("/rooms/999/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    private Room createSampleRoom() {
        RoomType roomType = new RoomType();
        roomType.setId(1L);
        roomType.setName("Standard");
        roomType.setBasePrice(BigDecimal.valueOf(2000));
        roomType.setCapacity(2);

        Room room = new Room();
        room.setId(1L);
        room.setRoomNumber("101");
        room.setRoomType(roomType);
        room.setStatus(Room.RoomStatus.available);
        room.setFloor(1);

        return room;
    }
}