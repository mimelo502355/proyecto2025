package com.example.Proyect_ing_soft.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration 
public class AppConfig {

    /**
     * Define el Bean de PasswordEncoder (BCrypt) para cifrar contraseñas.
     * Esto es crucial para la seguridad (RNF-17).
     * @return una instancia de BCryptPasswordEncoder
     */
}
