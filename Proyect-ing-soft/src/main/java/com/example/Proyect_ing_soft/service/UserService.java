package com.example.Proyect_ing_soft.service;

import com.example.Proyect_ing_soft.model.Role;
import com.example.Proyect_ing_soft.model.RoleName;
import com.example.Proyect_ing_soft.model.User;
import com.example.Proyect_ing_soft.repository.RoleRepository;
import com.example.Proyect_ing_soft.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * RF-02: Obtener todos los usuarios del sistema.
     * Solo accesible por ROLE_ADMIN.
     */
    public List<User> findAll() {
        return userRepository.findAll();
    }

    /**
     * RF-02: Crear un nuevo usuario.
     * La contraseña se cifra con BCrypt (RNF-17).
     * @param user El objeto User a guardar.
     * @param roleNames Los roles a asignar al nuevo usuario.
     * @return El usuario guardado.
     */
    public User createUser(User user, Set<String> roleNames) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya está en uso.");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        Set<Role> roles = new HashSet<>();
        if (roleNames == null || roleNames.isEmpty()) {
            Role meseroRole = roleRepository.findByName(RoleName.ROLE_MOZO)
                    .orElseThrow(() -> new RuntimeException("Error: Role 'Mesero' no encontrado."));
            roles.add(meseroRole);
        } else {
            roleNames.forEach(roleName -> {
                Role role = roleRepository.findByName(RoleName.valueOf(roleName))
                        .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " no encontrado."));
                roles.add(role);
            });
        }
        user.setRoles(roles);
        return userRepository.save(user);
    }
    
    /**
     * RF-02: Actualizar la información de un usuario existente.
     * @param id ID del usuario.
     * @param userDetails Los nuevos detalles del usuario.
     * @param roleNames Los nuevos roles.
     * @return El usuario actualizado.
     */
    public User updateUser(Long id, User userDetails, Set<String> roleNames) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));

        user.setUsername(userDetails.getUsername());
       
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        // Actualizar roles
        if (roleNames != null && !roleNames.isEmpty()) {
            Set<Role> newRoles = new HashSet<>();
            roleNames.forEach(roleName -> {
                Role role = roleRepository.findByName(RoleName.valueOf(roleName))
                        .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " no encontrado."));
                newRoles.add(role);
            });
            user.setRoles(newRoles);
        }
        
        user.setAccountNonLocked(userDetails.isAccountNonLocked());
        
        return userRepository.save(user);
    }
    
    /**
     * RF-02: Eliminar un usuario.
     */
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado con id: " + id);
        }
        userRepository.deleteById(id);
    }

    /**
     * RF-05: Bloquear o desbloquear una cuenta de usuario.
     */
    public User toggleAccountLock(Long id, boolean lock) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
        
        user.setAccountNonLocked(!lock); // Si 'lock' es true, 'accountNonLocked' es false
        return userRepository.save(user);
    }

}