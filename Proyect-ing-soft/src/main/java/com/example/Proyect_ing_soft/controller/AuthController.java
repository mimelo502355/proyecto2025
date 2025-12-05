package com.example.Proyect_ing_soft.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException; // Importante
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*; // RestController, etc.

import com.example.Proyect_ing_soft.model.*;
import com.example.Proyect_ing_soft.payload.request.LoginRequest;
import com.example.Proyect_ing_soft.payload.response.JwtResponse;
import com.example.Proyect_ing_soft.repository.*;
import com.example.Proyect_ing_soft.security.jwt.JwtUtils;
import com.example.Proyect_ing_soft.security.service.CustomUserDetails;
import com.example.Proyect_ing_soft.service.EmailService;

@RestController
@RequestMapping("/api/auth")
// NOTA: No usamos @CrossOrigin aquí porque ya está en SecurityConfig
public class AuthController {

    @Autowired AuthenticationManager authenticationManager;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtUtils jwtUtils;
    @Autowired EmailService emailService;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody LoginRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: ¡El usuario ya existe!");
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setEmail(signUpRequest.getUsername() + "@elpicante.com"); 
        
        String code = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setVerificationCode(code);
        user.setAccountNonLocked(false); // CRÍTICO: Nace bloqueado

        Set<Role> roles = new HashSet<>();
        String strRole = signUpRequest.getRole(); 

        if (strRole == null || strRole.isEmpty()) {
            Role defaultRole = roleRepository.findByName(RoleName.ROLE_MOZO)
                    .orElseThrow(() -> new RuntimeException("Error: Rol no encontrado."));
            roles.add(defaultRole);
            strRole = "mozo";
        } else {
            // Lógica simple de roles
            Role role = switch (strRole.toLowerCase()) {
                case "admin" -> roleRepository.findByName(RoleName.ROLE_ADMIN).orElseThrow();
                case "cocina" -> roleRepository.findByName(RoleName.ROLE_COCINA).orElseThrow();
                default -> roleRepository.findByName(RoleName.ROLE_MOZO).orElseThrow();
            };
            roles.add(role);
        }

        user.setRoles(roles);
        userRepository.save(user);

        // Envío de correo
        try {
            emailService.enviarCodigoAlAdmin(user.getUsername(), strRole, code);
        } catch (Exception e) {
            System.err.println("Error enviando email: " + e.getMessage());
        }

        return ResponseEntity.ok("Solicitud enviada. Esperando verificación.");
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@RequestBody LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));

        if (user.getVerificationCode() == null) {
            return ResponseEntity.badRequest().body("Error: Cuenta ya verificada.");
        }

        if (user.getVerificationCode().trim().equals(request.getPassword().trim())) {
            user.setAccountNonLocked(true); // Desbloqueamos
            user.setVerificationCode(null); 
            userRepository.save(user);
            return ResponseEntity.ok("¡Cuenta verificada!");
        } else {
            return ResponseEntity.badRequest().body("Error: Código incorrecto.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication); 
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority()).collect(Collectors.toList());

            return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getId(), userDetails.getUsername(), userDetails.getEmail(), roles));
                                                     
        } catch (LockedException e) {
            // Aquí cae si accountNonLocked es false
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Error: Cuenta no verificada. Ingrese el código primero.");
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body("Error: Credenciales inválidas.");
        }
    }
}