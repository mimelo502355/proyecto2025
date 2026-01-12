package com.example.Proyect_ing_soft.service;

import com.example.Proyect_ing_soft.model.Role;
import com.example.Proyect_ing_soft.model.RoleName;
import com.example.Proyect_ing_soft.model.User;
import com.example.Proyect_ing_soft.repository.RoleRepository;
import com.example.Proyect_ing_soft.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de Tests de Caja Blanca para UserService
 * Cobertura: 100% de caminos de ejecución, condicionales y excepciones
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Role mozoRole;
    private Role adminRole;
    private Role cocinaRole;

    @BeforeEach
    void setUp() {
        // Usuario de prueba
        testUser = new User("testuser", "test@test.com", "password123");
        testUser.setId(1L);
        testUser.setAccountNonLocked(true);

        // Roles de prueba
        mozoRole = new Role();
        mozoRole.setId(1);
        mozoRole.setName(RoleName.ROLE_MOZO);

        adminRole = new Role();
        adminRole.setId(2);
        adminRole.setName(RoleName.ROLE_ADMIN);

        cocinaRole = new Role();
        cocinaRole.setId(3);
        cocinaRole.setName(RoleName.ROLE_COCINA);
    }

    // ============================================================
    // TESTS PARA findAll()
    // ============================================================
    @Nested
    @DisplayName("Tests para findAll()")
    class FindAllTests {

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay usuarios")
        void findAll_ReturnsEmptyList_WhenNoUsersExist() {
            when(userRepository.findAll()).thenReturn(Collections.emptyList());

            List<User> result = userService.findAll();

            assertTrue(result.isEmpty());
            verify(userRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Debe retornar todos los usuarios existentes")
        void findAll_ReturnsAllUsers_WhenUsersExist() {
            User user2 = new User("user2", "user2@test.com", "pass");
            when(userRepository.findAll()).thenReturn(Arrays.asList(testUser, user2));

            List<User> result = userService.findAll();

            assertEquals(2, result.size());
            verify(userRepository, times(1)).findAll();
        }
    }

    // ============================================================
    // TESTS PARA createUser()
    // ============================================================
    @Nested
    @DisplayName("Tests para createUser()")
    class CreateUserTests {

        @Test
        @DisplayName("Debe lanzar excepción cuando el username ya existe")
        void createUser_ThrowsException_WhenUsernameExists() {
            when(userRepository.existsByUsername("testuser")).thenReturn(true);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.createUser(testUser, null));

            assertEquals("El nombre de usuario ya está en uso.", exception.getMessage());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe asignar rol MOZO por defecto cuando roleNames es null")
        void createUser_AssignsMozoRole_WhenRoleNamesIsNull() {
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            User result = userService.createUser(testUser, null);

            assertNotNull(result);
            verify(roleRepository).findByName(RoleName.ROLE_MOZO);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Debe asignar rol MOZO por defecto cuando roleNames está vacío")
        void createUser_AssignsMozoRole_WhenRoleNamesIsEmpty() {
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            User result = userService.createUser(testUser, new HashSet<>());

            assertNotNull(result);
            verify(roleRepository).findByName(RoleName.ROLE_MOZO);
        }

        @Test
        @DisplayName("Debe asignar roles específicos cuando se proporcionan")
        void createUser_AssignsSpecificRoles_WhenProvided() {
            Set<String> roleNames = new HashSet<>(Arrays.asList("ROLE_ADMIN", "ROLE_COCINA"));
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
            when(roleRepository.findByName(RoleName.ROLE_COCINA)).thenReturn(Optional.of(cocinaRole));
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            User result = userService.createUser(testUser, roleNames);

            assertNotNull(result);
            verify(roleRepository).findByName(RoleName.ROLE_ADMIN);
            verify(roleRepository).findByName(RoleName.ROLE_COCINA);
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando el rol por defecto no existe")
        void createUser_ThrowsException_WhenDefaultRoleNotFound() {
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.createUser(testUser, null));

            assertTrue(exception.getMessage().contains("Role 'Mesero' no encontrado"));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando un rol específico no existe")
        void createUser_ThrowsException_WhenSpecificRoleNotFound() {
            Set<String> roleNames = new HashSet<>(Collections.singletonList("ROLE_ADMIN"));
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.createUser(testUser, roleNames));

            assertTrue(exception.getMessage().contains("Role ROLE_ADMIN no encontrado"));
        }

        @Test
        @DisplayName("Debe cifrar la contraseña correctamente")
        void createUser_EncodesPassword() {
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(passwordEncoder.encode("password123")).thenReturn("$2a$encoded$password");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.createUser(testUser, null);

            assertEquals("$2a$encoded$password", result.getPassword());
            verify(passwordEncoder).encode("password123");
        }
    }

    // ============================================================
    // TESTS PARA updateUser()
    // ============================================================
    @Nested
    @DisplayName("Tests para updateUser()")
    class UpdateUserTests {

        @Test
        @DisplayName("Debe lanzar excepción cuando el usuario no existe")
        void updateUser_ThrowsException_WhenUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.updateUser(999L, testUser, null));

            assertEquals("Usuario no encontrado con id: 999", exception.getMessage());
        }

        @Test
        @DisplayName("Debe actualizar username correctamente")
        void updateUser_UpdatesUsername() {
            User existingUser = new User("olduser", "old@test.com", "oldpass");
            existingUser.setId(1L);
            
            User newDetails = new User("newuser", "new@test.com", "");
            newDetails.setAccountNonLocked(true);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, null);

            assertEquals("newuser", result.getUsername());
        }

        @Test
        @DisplayName("Debe actualizar contraseña cuando se proporciona")
        void updateUser_UpdatesPassword_WhenProvided() {
            User existingUser = new User("user", "email@test.com", "oldpass");
            existingUser.setId(1L);
            
            User newDetails = new User("user", "email@test.com", "newpassword");
            newDetails.setAccountNonLocked(true);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.encode("newpassword")).thenReturn("$2a$newencoded");
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, null);

            assertEquals("$2a$newencoded", result.getPassword());
            verify(passwordEncoder).encode("newpassword");
        }

        @Test
        @DisplayName("No debe actualizar contraseña cuando es null")
        void updateUser_DoesNotUpdatePassword_WhenNull() {
            User existingUser = new User("user", "email@test.com", "existingpass");
            existingUser.setId(1L);
            
            User newDetails = new User("user", "email@test.com", null);
            newDetails.setAccountNonLocked(true);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, null);

            assertEquals("existingpass", result.getPassword());
            verify(passwordEncoder, never()).encode(any());
        }

        @Test
        @DisplayName("No debe actualizar contraseña cuando está vacía")
        void updateUser_DoesNotUpdatePassword_WhenEmpty() {
            User existingUser = new User("user", "email@test.com", "existingpass");
            existingUser.setId(1L);
            
            User newDetails = new User("user", "email@test.com", "");
            newDetails.setAccountNonLocked(true);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, null);

            assertEquals("existingpass", result.getPassword());
            verify(passwordEncoder, never()).encode(any());
        }

        @Test
        @DisplayName("Debe actualizar roles cuando se proporcionan")
        void updateUser_UpdatesRoles_WhenProvided() {
            User existingUser = new User("user", "email@test.com", "pass");
            existingUser.setId(1L);
            existingUser.setRoles(new HashSet<>(Collections.singletonList(mozoRole)));
            
            User newDetails = new User("user", "email@test.com", "");
            newDetails.setAccountNonLocked(true);
            
            Set<String> newRoles = new HashSet<>(Collections.singletonList("ROLE_ADMIN"));
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, newRoles);

            assertTrue(result.getRoles().contains(adminRole));
            verify(roleRepository).findByName(RoleName.ROLE_ADMIN);
        }

        @Test
        @DisplayName("No debe actualizar roles cuando roleNames es null")
        void updateUser_DoesNotUpdateRoles_WhenNull() {
            User existingUser = new User("user", "email@test.com", "pass");
            existingUser.setId(1L);
            Set<Role> originalRoles = new HashSet<>(Collections.singletonList(mozoRole));
            existingUser.setRoles(originalRoles);
            
            User newDetails = new User("user", "email@test.com", "");
            newDetails.setAccountNonLocked(true);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, null);

            assertEquals(originalRoles, result.getRoles());
            verify(roleRepository, never()).findByName(any());
        }

        @Test
        @DisplayName("No debe actualizar roles cuando roleNames está vacío")
        void updateUser_DoesNotUpdateRoles_WhenEmpty() {
            User existingUser = new User("user", "email@test.com", "pass");
            existingUser.setId(1L);
            Set<Role> originalRoles = new HashSet<>(Collections.singletonList(mozoRole));
            existingUser.setRoles(originalRoles);
            
            User newDetails = new User("user", "email@test.com", "");
            newDetails.setAccountNonLocked(true);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, new HashSet<>());

            assertEquals(originalRoles, result.getRoles());
        }

        @Test
        @DisplayName("Debe actualizar accountNonLocked")
        void updateUser_UpdatesAccountLockStatus() {
            User existingUser = new User("user", "email@test.com", "pass");
            existingUser.setId(1L);
            existingUser.setAccountNonLocked(true);
            
            User newDetails = new User("user", "email@test.com", "");
            newDetails.setAccountNonLocked(false);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.updateUser(1L, newDetails, null);

            assertFalse(result.isAccountNonLocked());
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando rol no existe en update")
        void updateUser_ThrowsException_WhenRoleNotFound() {
            User existingUser = new User("user", "email@test.com", "pass");
            existingUser.setId(1L);
            
            User newDetails = new User("user", "email@test.com", "");
            newDetails.setAccountNonLocked(true);
            
            Set<String> newRoles = new HashSet<>(Collections.singletonList("ROLE_COCINA"));
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(roleRepository.findByName(RoleName.ROLE_COCINA)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.updateUser(1L, newDetails, newRoles));

            assertTrue(exception.getMessage().contains("Role ROLE_COCINA no encontrado"));
        }
    }

    // ============================================================
    // TESTS PARA deleteUser()
    // ============================================================
    @Nested
    @DisplayName("Tests para deleteUser()")
    class DeleteUserTests {

        @Test
        @DisplayName("Debe lanzar excepción cuando el usuario no existe")
        void deleteUser_ThrowsException_WhenUserNotFound() {
            when(userRepository.existsById(999L)).thenReturn(false);

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.deleteUser(999L));

            assertEquals("Usuario no encontrado con id: 999", exception.getMessage());
            verify(userRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("Debe eliminar usuario cuando existe")
        void deleteUser_DeletesUser_WhenExists() {
            when(userRepository.existsById(1L)).thenReturn(true);
            doNothing().when(userRepository).deleteById(1L);

            assertDoesNotThrow(() -> userService.deleteUser(1L));

            verify(userRepository).deleteById(1L);
        }
    }

    // ============================================================
    // TESTS PARA toggleAccountLock()
    // ============================================================
    @Nested
    @DisplayName("Tests para toggleAccountLock()")
    class ToggleAccountLockTests {

        @Test
        @DisplayName("Debe lanzar excepción cuando el usuario no existe")
        void toggleAccountLock_ThrowsException_WhenUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> userService.toggleAccountLock(999L, true));

            assertEquals("Usuario no encontrado con id: 999", exception.getMessage());
        }

        @Test
        @DisplayName("Debe bloquear cuenta cuando lock es true")
        void toggleAccountLock_LocksAccount_WhenLockIsTrue() {
            User existingUser = new User("user", "email@test.com", "pass");
            existingUser.setId(1L);
            existingUser.setAccountNonLocked(true);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.toggleAccountLock(1L, true);

            assertFalse(result.isAccountNonLocked());
        }

        @Test
        @DisplayName("Debe desbloquear cuenta cuando lock es false")
        void toggleAccountLock_UnlocksAccount_WhenLockIsFalse() {
            User existingUser = new User("user", "email@test.com", "pass");
            existingUser.setId(1L);
            existingUser.setAccountNonLocked(false);
            
            when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

            User result = userService.toggleAccountLock(1L, false);

            assertTrue(result.isAccountNonLocked());
        }
    }
}
