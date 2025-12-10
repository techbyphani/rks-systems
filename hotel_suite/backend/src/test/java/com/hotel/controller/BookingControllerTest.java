package com.hotel.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotel.dto.BookingRequest;
import com.hotel.entity.Guest;
import com.hotel.entity.Room;
import com.hotel.entity.RoomBooking;
import com.hotel.entity.RoomType;
import com.hotel.service.BookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllBookings_Success() throws Exception {
        RoomBooking booking = createSampleBooking();
        List<RoomBooking> bookings = Arrays.asList(booking);

        when(bookingService.getAllBookings(null, null, null)).thenReturn(bookings);

        mockMvc.perform(get("/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookingId").value("BK123"));
    }

    @Test
    void createBooking_Success() throws Exception {
        BookingRequest request = new BookingRequest();
        request.setGuestName("John Doe");
        request.setGuestPhone("1234567890");
        request.setRoomTypeId(1L);
        request.setCheckInDate(LocalDate.now());
        request.setCheckOutDate(LocalDate.now().plusDays(2));

        RoomBooking booking = createSampleBooking();
        when(bookingService.createBooking(any(BookingRequest.class))).thenReturn(booking);

        mockMvc.perform(post("/bookings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingId").value("BK123"));
    }

    @Test
    void checkIn_Success() throws Exception {
        RoomBooking booking = createSampleBooking();
        booking.setStatus(RoomBooking.BookingStatus.checked_in);

        when(bookingService.checkIn(anyLong())).thenReturn(booking);

        mockMvc.perform(put("/bookings/1/checkin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("checked_in"));
    }

    @Test
    void checkIn_BookingNotFound() throws Exception {
        when(bookingService.checkIn(anyLong()))
                .thenThrow(new RuntimeException("Booking not found"));

        mockMvc.perform(put("/bookings/999/checkin"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void checkOut_Success() throws Exception {
        RoomBooking booking = createSampleBooking();
        booking.setStatus(RoomBooking.BookingStatus.checked_out);

        when(bookingService.checkOut(anyLong())).thenReturn(booking);

        mockMvc.perform(put("/bookings/1/checkout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("checked_out"));
    }

    private RoomBooking createSampleBooking() {
        Guest guest = new Guest();
        guest.setId(1L);
        guest.setName("John Doe");
        guest.setPhone("1234567890");

        RoomType roomType = new RoomType();
        roomType.setId(1L);
        roomType.setName("Standard");
        roomType.setBasePrice(BigDecimal.valueOf(2000));

        Room room = new Room();
        room.setId(1L);
        room.setRoomNumber("101");
        room.setRoomType(roomType);

        RoomBooking booking = new RoomBooking();
        booking.setId(1L);
        booking.setBookingId("BK123");
        booking.setGuest(guest);
        booking.setRoom(room);
        booking.setCheckInDate(LocalDate.now());
        booking.setCheckOutDate(LocalDate.now().plusDays(2));
        booking.setStatus(RoomBooking.BookingStatus.confirmed);
        booking.setTotalAmount(BigDecimal.valueOf(4000));

        return booking;
    }
}