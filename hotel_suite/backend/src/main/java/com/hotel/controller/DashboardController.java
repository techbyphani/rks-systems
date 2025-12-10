package com.hotel.controller;

import com.hotel.dto.DashboardStatsResponse;
import com.hotel.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        DashboardStatsResponse stats = dashboardService.getStats();
        return ResponseEntity.ok(stats);
    }
}

