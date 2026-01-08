package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.Attendance;
import com.example.Proyect_ing_soft.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public List<Attendance> getAllAttendance() {
        return attendanceService.getAllAttendance();
    }
}
