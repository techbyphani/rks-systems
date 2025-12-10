package com.hotel.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.dto.BookingRequest;
import com.hotel.entity.Room;
import com.hotel.entity.RoomType;
import com.hotel.repository.RoomRepository;
import com.hotel.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class BookingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomRepository roomRepository;

    @BeforeEach
    void setUp() {
        RoomType roomType = new RoomType();
        roomType.setName("Standard");
        roomType.setBasePrice(BigDecimal.valueOf(2000));
        roomType.setCapacity(2);
        roomType = roomTypeRepository.save(roomType);

        Room room = new Room();
        room.setRoomNumber("101");
        room.setRoomType(roomType);
        room.setStatus(Room.RoomStatus.available);
        room.setFloor(1);
        roomRepository.save(room);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createBooking_IntegrationTest() throws Exception {
        BookingRequest request = new BookingRequest();
        request.setGuestName("John Doe");
        request.setGuestPhone("1234567890");
        request.setRoomTypeId(1L);
        request.setCheckInDate(LocalDate.now());
        request.setCheckOutDate(LocalDate.now().plusDays(2));
        request.setAdults(2);
        request.setChildren(0);

        mockMvc.perform(post("/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.guest.name").value("John Doe"))
                .andExpect(jsonPath("$.room.roomNumber").value("101"))
                .andExpect(jsonPath("$.status").value("confirmed"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllBookings_IntegrationTest() throws Exception {
        mockMvc.perform(get("/bookings"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}