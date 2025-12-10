package com.hotel.controller;

import com.hotel.dto.BillItemRequest;
import com.hotel.dto.BillRequest;
import com.hotel.dto.PaymentUpdateRequest;
import com.hotel.entity.Bill;
import com.hotel.entity.BillItem;
import com.hotel.service.BillService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/bills")
public class BillController {

    @Autowired
    private BillService billService;

    @GetMapping
    public ResponseEntity<List<Bill>> getAllBills() {
        List<Bill> bills = billService.getAllBills();
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/{billId}")
    public ResponseEntity<?> getBillById(@PathVariable Long billId) {
        Optional<Bill> bill = billService.getBillById(billId);
        if (bill.isPresent()) {
            return ResponseEntity.ok(bill.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NOT_FOUND", "message", "Bill not found"));
    }

    @PostMapping
    public ResponseEntity<?> createBill(@Valid @RequestBody BillRequest request) {
        try {
            Bill bill = billService.createBill(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(bill);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    @PutMapping("/{billId}/payment")
    public ResponseEntity<?> updatePaymentStatus(@PathVariable Long billId, 
                                                @Valid @RequestBody PaymentUpdateRequest request) {
        try {
            Bill bill = billService.updatePaymentStatus(billId, request);
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Bill>> getBillsByBooking(@PathVariable Long bookingId) {
        List<Bill> bills = billService.getBillsByBooking(bookingId);
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/guest/{guestId}")
    public ResponseEntity<List<Bill>> getBillsByGuest(@PathVariable Long guestId) {
        List<Bill> bills = billService.getBillsByGuest(guestId);
        return ResponseEntity.ok(bills);
    }

    @PostMapping("/{billId}/items")
    public ResponseEntity<?> addBillItem(@PathVariable Long billId, 
                                       @Valid @RequestBody BillItemRequest request) {
        try {
            BillItem item = billService.addBillItem(billId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(item);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    @PUT("/{billId}/items/{itemId}")
    public ResponseEntity<?> updateBillItem(@PathVariable Long billId, 
                                          @PathVariable Long itemId,
                                          @Valid @RequestBody BillItemRequest request) {
        try {
            BillItem item = billService.updateBillItem(billId, itemId, request);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }

    @DELETE("/{billId}/items/{itemId}")
    public ResponseEntity<?> deleteBillItem(@PathVariable Long billId, @PathVariable Long itemId) {
        try {
            billService.deleteBillItem(billId, itemId);
            return ResponseEntity.ok(Map.of("message", "Bill item deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }
}