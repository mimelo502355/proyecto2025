package com.example.Proyect_ing_soft.security.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Proyect_ing_soft.model.User;
import com.example.Proyect_ing_soft.repository.UserRepository;

@Service // <--- Importante: Esto le dice a Spring que es un Servicio
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    UserRepository userRepository; // Usamos tu repositorio para buscar en la BD

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
        // 1. Buscamos el usuario en la Base de Datos
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con nombre: " + username));

        // 2. Convertimos tu usuario de BD (Entity) a un usuario de Seguridad (UserDetails)
        //    usando el método 'build' que creamos en el paso anterior.
        return CustomUserDetails.build(user);
    }
}