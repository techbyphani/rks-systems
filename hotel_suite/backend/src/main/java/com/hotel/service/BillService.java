package com.hotel.service;

import com.hotel.dto.BillItemRequest;
import com.hotel.dto.BillRequest;
import com.hotel.dto.PaymentUpdateRequest;
import com.hotel.entity.Bill;
import com.hotel.entity.BillItem;
import com.hotel.entity.RoomBooking;
import com.hotel.repository.BillItemRepository;
import com.hotel.repository.BillRepository;
import com.hotel.repository.RoomBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;
    
    @Autowired
    private RoomBookingRepository bookingRepository;
    
    @Autowired
    private BillItemRepository billItemRepository;

    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }
    
    public Optional<Bill> getBillById(Long billId) {
        return billRepository.findById(billId);
    }
    
    public Bill createBill(BillRequest request) {
        RoomBooking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        Bill bill = new Bill();
        bill.setBillNumber("BILL" + System.currentTimeMillis());
        bill.setRoomBooking(booking);
        bill.setGuest(booking.getGuest());
        bill.setRoomCharges(request.getRoomCharges());
        bill.setFoodCharges(request.getFoodCharges());
        bill.setOtherCharges(request.getOtherCharges());
        bill.setTaxAmount(request.getTaxAmount());
        
        BigDecimal total = request.getRoomCharges()
                .add(request.getFoodCharges())
                .add(request.getOtherCharges())
                .add(request.getTaxAmount());
        bill.setTotalAmount(total);
        
        bill.setPaymentStatus(Bill.PaymentStatus.pending);
        bill.setCreatedAt(LocalDateTime.now());
        
        return billRepository.save(bill);
    }
    
    public Bill updatePaymentStatus(Long billId, PaymentUpdateRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        bill.setPaymentStatus(Bill.PaymentStatus.valueOf(request.getPaymentStatus()));
        if (request.getPaymentMethod() != null) {
            bill.setPaymentMethod(request.getPaymentMethod());
        }
        if (request.getTransactionId() != null) {
            bill.setTransactionId(request.getTransactionId());
        }
        
        return billRepository.save(bill);
    }

    public List<Bill> getBillsByBooking(Long bookingId) {
        return billRepository.findByRoomBookingId(bookingId);
    }

    public List<Bill> getBillsByGuest(Long guestId) {
        return billRepository.findByGuestId(guestId);
    }
    
    public BillItem addBillItem(Long billId, BillItemRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        BillItem item = new BillItem();
        item.setBill(bill);
        item.setDescription(request.getDescription());
        item.setAmount(request.getAmount());
        item.setQuantity(request.getQuantity());
        
        BillItem savedItem = billItemRepository.save(item);
        
        // Recalculate bill total
        recalculateBillTotal(bill);
        
        return savedItem;
    }
    
    public BillItem updateBillItem(Long billId, Long itemId, BillItemRequest request) {
        BillItem item = billItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Bill item not found"));
        
        if (!item.getBill().getId().equals(billId)) {
            throw new RuntimeException("Bill item does not belong to this bill");
        }
        
        item.setDescription(request.getDescription());
        item.setAmount(request.getAmount());
        item.setQuantity(request.getQuantity());
        
        BillItem savedItem = billItemRepository.save(item);
        
        // Recalculate bill total
        recalculateBillTotal(item.getBill());
        
        return savedItem;
    }
    
    public void deleteBillItem(Long billId, Long itemId) {
        BillItem item = billItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Bill item not found"));
        
        if (!item.getBill().getId().equals(billId)) {
            throw new RuntimeException("Bill item does not belong to this bill");
        }
        
        Bill bill = item.getBill();
        billItemRepository.delete(item);
        
        // Recalculate bill total
        recalculateBillTotal(bill);
    }
    
    private void recalculateBillTotal(Bill bill) {
        BigDecimal itemsTotal = bill.getItems().stream()
                .map(item -> item.getAmount().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal newTotal = bill.getRoomCharges()
                .add(bill.getFoodCharges())
                .add(bill.getOtherCharges())
                .add(itemsTotal)
                .add(bill.getTaxAmount());
        
        bill.setTotalAmount(newTotal);
        billRepository.save(bill);
    }
}