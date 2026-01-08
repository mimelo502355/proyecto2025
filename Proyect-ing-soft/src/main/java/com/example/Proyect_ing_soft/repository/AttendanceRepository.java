package com.example.Proyect_ing_soft.repository;

import com.example.Proyect_ing_soft.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByUserId(Long userId);
}
