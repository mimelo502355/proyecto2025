package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.User;
import com.example.Proyect_ing_soft.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/management/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * RF-02: Obtener todos los usuarios.
     * RNF-14: Solo ROLE_ADMIN puede acceder.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    /**
     * RF-02: Crear nuevo usuario.
     * RNF-14: Solo ROLE_ADMIN puede acceder.
     * Nota: Asume que el JSON de entrada incluye la lista de roles en un campo 'roles'.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user, user.getRoles().stream().map(r -> r.getName().name()).collect(java.util.stream.Collectors.toSet()));
        return ResponseEntity.ok(createdUser);
    }

    /**
     * RF-02: Actualizar usuario.
     * RNF-14: Solo ROLE_ADMIN puede acceder.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User updatedUser = userService.updateUser(id, userDetails, userDetails.getRoles().stream().map(r -> r.getName().name()).collect(java.util.stream.Collectors.toSet()));
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * RF-02: Eliminar usuario.
     * RNF-14: Solo ROLE_ADMIN puede acceder.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        Map<String, Boolean> response = new HashMap<>();
        response.put("deleted", Boolean.TRUE);
        return ResponseEntity.ok(response);
    }
    
    /**
     * RF-05: Bloquear o desbloquear cuenta de usuario.
     * RNF-14: Solo ROLE_ADMIN puede acceder.
     */
    @PutMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> toggleLock(@PathVariable Long id, @RequestParam boolean lock) {
        User user = userService.toggleAccountLock(id, lock);
        return ResponseEntity.ok(user);
    }
}