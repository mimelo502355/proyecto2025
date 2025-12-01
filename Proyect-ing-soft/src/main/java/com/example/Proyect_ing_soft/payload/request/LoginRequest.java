package com.example.Proyect_ing_soft.payload.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data // Lombok
public class LoginRequest {

    @NotBlank 
    private String username;

    @NotBlank
    private String password;
    private String role;
}