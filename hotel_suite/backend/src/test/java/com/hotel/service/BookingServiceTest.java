package com.hotel.service;

import com.hotel.dto.BookingRequest;
import com.hotel.entity.*;
import com.hotel.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private RoomBookingRepository bookingRepository;

    @Mock
    private GuestRepository guestRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomTypeRepository roomTypeRepository;

    @InjectMocks
    private BookingService bookingService;

    private Guest testGuest;
    private Room testRoom;
    private RoomType testRoomType;
    private RoomBooking testBooking;
    private BookingRequest bookingRequest;

    @BeforeEach
    void setUp() {
        testGuest = new Guest();
        testGuest.setId(1L);
        testGuest.setName("John Doe");
        testGuest.setPhone("1234567890");

        testRoomType = new RoomType();
        testRoomType.setId(1L);
        testRoomType.setName("Standard");
        testRoomType.setBasePrice(BigDecimal.valueOf(2000));
        testRoomType.setCapacity(2);

        testRoom = new Room();
        testRoom.setId(1L);
        testRoom.setRoomNumber("101");
        testRoom.setRoomType(testRoomType);
        testRoom.setStatus(Room.RoomStatus.available);

        testBooking = new RoomBooking();
        testBooking.setId(1L);
        testBooking.setBookingId("BK123");
        testBooking.setGuest(testGuest);
        testBooking.setRoom(testRoom);
        testBooking.setCheckInDate(LocalDate.now());
        testBooking.setCheckOutDate(LocalDate.now().plusDays(2));
        testBooking.setStatus(RoomBooking.BookingStatus.confirmed);

        bookingRequest = new BookingRequest();
        bookingRequest.setGuestName("John Doe");
        bookingRequest.setGuestPhone("1234567890");
        bookingRequest.setRoomTypeId(1L);
        bookingRequest.setCheckInDate(LocalDate.now());
        bookingRequest.setCheckOutDate(LocalDate.now().plusDays(2));
        bookingRequest.setAdults(2);
        bookingRequest.setChildren(0);
    }

    @Test
    void getAllBookings_Success() {
        List<RoomBooking> bookings = Arrays.asList(testBooking);
        when(bookingRepository.findAll()).thenReturn(bookings);

        List<RoomBooking> result = bookingService.getAllBookings(null, null, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("BK123", result.get(0).getBookingId());
    }

    @Test
    void createBooking_NewGuest() {
        when(guestRepository.findByPhone("1234567890")).thenReturn(Optional.empty());
        when(guestRepository.save(any(Guest.class))).thenReturn(testGuest);
        when(roomTypeRepository.findById(1L)).thenReturn(Optional.of(testRoomType));
        when(roomRepository.findByRoomTypeId(1L)).thenReturn(Arrays.asList(testRoom));
        when(roomRepository.save(any(Room.class))).thenReturn(testRoom);
        when(bookingRepository.save(any(RoomBooking.class))).thenReturn(testBooking);

        RoomBooking result = bookingService.createBooking(bookingRequest);

        assertNotNull(result);
        assertEquals("BK123", result.getBookingId());
        verify(guestRepository).save(any(Guest.class));
        verify(bookingRepository).save(any(RoomBooking.class));
    }

    @Test
    void createBooking_ExistingGuest() {
        when(guestRepository.findByPhone("1234567890")).thenReturn(Optional.of(testGuest));
        when(roomTypeRepository.findById(1L)).thenReturn(Optional.of(testRoomType));
        when(roomRepository.findByRoomTypeId(1L)).thenReturn(Arrays.asList(testRoom));
        when(roomRepository.save(any(Room.class))).thenReturn(testRoom);
        when(bookingRepository.save(any(RoomBooking.class))).thenReturn(testBooking);

        RoomBooking result = bookingService.createBooking(bookingRequest);

        assertNotNull(result);
        assertEquals("BK123", result.getBookingId());
        verify(guestRepository, never()).save(any(Guest.class));
        verify(bookingRepository).save(any(RoomBooking.class));
    }

    @Test
    void checkIn_Success() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(RoomBooking.class))).thenReturn(testBooking);
        when(roomRepository.save(any(Room.class))).thenReturn(testRoom);

        RoomBooking result = bookingService.checkIn(1L);

        assertNotNull(result);
        assertEquals(RoomBooking.BookingStatus.checked_in, result.getStatus());
        assertNotNull(result.getActualCheckIn());
        verify(roomRepository).save(testRoom);
        assertEquals(Room.RoomStatus.occupied, testRoom.getStatus());
    }

    @Test
    void checkIn_BookingNotFound() {
        when(bookingRepository.findById(anyLong())).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            bookingService.checkIn(999L);
        });

        assertEquals("Booking not found", exception.getMessage());
    }

    @Test
    void checkOut_Success() {
        testBooking.setStatus(RoomBooking.BookingStatus.checked_in);
        testBooking.setActualCheckIn(LocalDateTime.now().minusDays(1));

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(RoomBooking.class))).thenReturn(testBooking);
        when(roomRepository.save(any(Room.class))).thenReturn(testRoom);

        RoomBooking result = bookingService.checkOut(1L);

        assertNotNull(result);
        assertEquals(RoomBooking.BookingStatus.checked_out, result.getStatus());
        assertNotNull(result.getActualCheckOut());
        verify(roomRepository).save(testRoom);
        assertEquals(Room.RoomStatus.dirty, testRoom.getStatus());
    }
}