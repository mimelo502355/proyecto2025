package com.example.Proyect_ing_soft.service;

import com.example.Proyect_ing_soft.model.Attendance;
import com.example.Proyect_ing_soft.model.User;
import com.example.Proyect_ing_soft.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    public Attendance logLogin(User user) {
        Attendance attendance = new Attendance();
        attendance.setUser(user);
        attendance.setLoginTime(LocalDateTime.now());
        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }
}
