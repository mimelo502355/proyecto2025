package com.example.Proyect_ing_soft.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Proyect_ing_soft.model.Role;
import com.example.Proyect_ing_soft.model.RoleName;
import com.example.Proyect_ing_soft.model.User;
import com.example.Proyect_ing_soft.payload.request.LoginRequest;
import com.example.Proyect_ing_soft.payload.response.JwtResponse;
import com.example.Proyect_ing_soft.repository.RoleRepository;
import com.example.Proyect_ing_soft.repository.UserRepository;
import com.example.Proyect_ing_soft.security.jwt.JwtUtils;
import com.example.Proyect_ing_soft.security.service.CustomUserDetails;
import com.example.Proyect_ing_soft.service.EmailService; // <--- 1. IMPORTANTE: IMPORTAR EL SERVICIO

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    EmailService emailService; // <--- 2. IMPORTANTE: INYECTAR EL SERVICIO

    // ==========================================
    // 1. REGISTRO (SIGNUP)
    // ==========================================
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody LoginRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: ¡El usuario ya existe!");
        }

        // 1. Crear el usuario básico
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setEmail(signUpRequest.getUsername() + "@elpicante.com"); // Email simulado
        
        // 2. Generar código de verificación
        String code = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setVerificationCode(code);
        user.setAccountNonLocked(false); 

        // 3. ASIGNACIÓN DE ROLES
        Set<Role> roles = new HashSet<>();
        
        // Obtenemos el texto que viene del Angular
        String strRole = signUpRequest.getRole(); 

        if (strRole == null || strRole.isEmpty()) {
            Role defaultRole = roleRepository.findByName(RoleName.ROLE_MOZO)
                    .orElseThrow(() -> new RuntimeException("Error: Rol MOZO no encontrado."));
            roles.add(defaultRole);
            strRole = "mozo (por defecto)";
        } else {
            switch (strRole.toLowerCase()) {
                case "admin":
                    Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                            .orElseThrow(() -> new RuntimeException("Error: Rol ADMIN no encontrado."));
                    roles.add(adminRole);
                    break;
                case "cocina":
                    Role cocinaRole = roleRepository.findByName(RoleName.ROLE_COCINA)
                            .orElseThrow(() -> new RuntimeException("Error: Rol COCINA no encontrado."));
                    roles.add(cocinaRole);
                    break;
                case "mozo":
                default:
                    Role mozoRole = roleRepository.findByName(RoleName.ROLE_MOZO)
                            .orElseThrow(() -> new RuntimeException("Error: Rol MOZO no encontrado."));
                    roles.add(mozoRole);
            }
        }

        user.setRoles(roles);
        userRepository.save(user);

        // Logs en consola
        System.out.println("------------------------------------------------");
        System.out.println(">>> USUARIO CREADO: " + user.getUsername());
        System.out.println(">>> ROL ASIGNADO: " + strRole);
        System.out.println(">>> CÓDIGO DE VERIFICACIÓN: " + code);
        System.out.println("------------------------------------------------");

        // --- 4. ENVÍO DE CORREO (AQUÍ ES DONDE DEBE IR) ---
        try {
            System.out.println(">>> LLAMANDO A EMAIL SERVICE...");
            emailService.enviarCodigoAlAdmin(user.getUsername(), strRole, code);
        } catch (Exception e) {
            System.err.println(">>> ERROR INTENTANDO ENVIAR EMAIL: " + e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok("Solicitud enviada. Pide el código de acceso al Administrador.");
    }

    // ==========================================
    // 2. VERIFICACIÓN (VERIFY)
    // ==========================================
    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@RequestBody LoginRequest request) {
        // 1. Buscar al usuario
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Error: Usuario no encontrado."));

        // 2. VALIDACIÓN DE SEGURIDAD (Si es null, ya se usó)
        if (user.getVerificationCode() == null) {
            return ResponseEntity.badRequest().body("Error: Esta cuenta ya está verificada o no tiene un código pendiente.");
        }

        // 3. Comparar códigos (Quitamos espacios en blanco con trim)
        String codigoBD = user.getVerificationCode().trim();
        String codigoFront = request.getPassword().trim();

        if (codigoBD.equals(codigoFront)) {
            user.setAccountNonLocked(true); // Desbloqueamos
            user.setVerificationCode(null); // Borramos código
            userRepository.save(user);
            
            return ResponseEntity.ok("¡Cuenta verificada con éxito! Ya puedes iniciar sesión.");
        } else {
            return ResponseEntity.badRequest().body("Error: Código incorrecto.");
        }
    }

    // ==========================================
    // 3. LOGIN
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        String jwt = jwtUtils.generateJwtToken(authentication); 

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt, 
                                                 userDetails.getId(), 
                                                 userDetails.getUsername(), 
                                                 userDetails.getEmail(), 
                                                 roles));
    }
}