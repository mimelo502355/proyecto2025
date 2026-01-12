package com.example.Proyect_ing_soft.controller;

import com.example.Proyect_ing_soft.model.*;
import com.example.Proyect_ing_soft.payload.request.LoginRequest;
import com.example.Proyect_ing_soft.payload.response.JwtResponse;
import com.example.Proyect_ing_soft.repository.*;
import com.example.Proyect_ing_soft.security.jwt.JwtUtils;
import com.example.Proyect_ing_soft.security.service.CustomUserDetails;
import com.example.Proyect_ing_soft.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de Tests de Caja Blanca para AuthController
 * Cobertura: 100% de caminos de ejecución, autenticación, verificación y excepciones
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthController authController;

    private User testUser;
    private Role mozoRole;
    private Role adminRole;
    private Role cocinaRole;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        mozoRole = new Role();
        mozoRole.setId(1);
        mozoRole.setName(RoleName.ROLE_MOZO);

        adminRole = new Role();
        adminRole.setId(2);
        adminRole.setName(RoleName.ROLE_ADMIN);

        cocinaRole = new Role();
        cocinaRole.setId(3);
        cocinaRole.setName(RoleName.ROLE_COCINA);

        testUser = new User("testuser", "test@test.com", "password123");
        testUser.setId(1L);
        testUser.setAccountNonLocked(true);

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
    }

    // ============================================================
    // TESTS PARA registerUser() / signup
    // ============================================================
    @Nested
    @DisplayName("Tests para registerUser() - /signup")
    class RegisterUserTests {

        @Test
        @DisplayName("Debe retornar error cuando username ya existe")
        void registerUser_ReturnsError_WhenUsernameExists() {
            when(userRepository.existsByUsername("testuser")).thenReturn(true);

            ResponseEntity<?> result = authController.registerUser(loginRequest);

            assertEquals(400, result.getStatusCode().value());
            assertEquals("Error: ¡El usuario ya existe!", result.getBody());
        }

        @Test
        @DisplayName("Debe asignar rol MOZO por defecto cuando role es null")
        void registerUser_AssignsMozoRole_WhenRoleIsNull() {
            loginRequest.setRole(null);
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            ResponseEntity<?> result = authController.registerUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            assertTrue(result.getBody().toString().contains("Solicitud enviada"));
        }

        @Test
        @DisplayName("Debe asignar rol MOZO por defecto cuando role está vacío")
        void registerUser_AssignsMozoRole_WhenRoleIsEmpty() {
            loginRequest.setRole("");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            ResponseEntity<?> result = authController.registerUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            verify(roleRepository).findByName(RoleName.ROLE_MOZO);
        }

        @Test
        @DisplayName("Debe asignar rol ADMIN cuando role es 'admin'")
        void registerUser_AssignsAdminRole_WhenRoleIsAdmin() {
            loginRequest.setRole("admin");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            ResponseEntity<?> result = authController.registerUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            verify(roleRepository).findByName(RoleName.ROLE_ADMIN);
        }

        @Test
        @DisplayName("Debe asignar rol COCINA cuando role es 'cocina'")
        void registerUser_AssignsCocinaRole_WhenRoleIsCocina() {
            loginRequest.setRole("cocina");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_COCINA)).thenReturn(Optional.of(cocinaRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            ResponseEntity<?> result = authController.registerUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            verify(roleRepository).findByName(RoleName.ROLE_COCINA);
        }

        @Test
        @DisplayName("Debe asignar rol MOZO cuando role es desconocido")
        void registerUser_AssignsMozoRole_WhenRoleIsUnknown() {
            loginRequest.setRole("unknown");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            ResponseEntity<?> result = authController.registerUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            verify(roleRepository).findByName(RoleName.ROLE_MOZO);
        }

        @Test
        @DisplayName("Debe crear usuario con cuenta bloqueada por defecto")
        void registerUser_CreatesUserWithLockedAccount() {
            loginRequest.setRole("mozo");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            authController.registerUser(loginRequest);

            verify(userRepository).save(argThat(user -> !user.isAccountNonLocked()));
        }

        @Test
        @DisplayName("Debe generar código de verificación")
        void registerUser_GeneratesVerificationCode() {
            loginRequest.setRole("mozo");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            authController.registerUser(loginRequest);

            verify(userRepository).save(argThat(user -> 
                user.getVerificationCode() != null && 
                user.getVerificationCode().length() == 6));
        }

        @Test
        @DisplayName("Debe enviar email de verificación")
        void registerUser_SendsVerificationEmail() {
            loginRequest.setRole("admin");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            authController.registerUser(loginRequest);

            verify(emailService).enviarCodigoAlAdmin(eq("testuser"), eq("admin"), anyString());
        }

        @Test
        @DisplayName("Debe continuar aunque falle el envío de email")
        void registerUser_ContinuesWhenEmailFails() {
            loginRequest.setRole("mozo");
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.of(mozoRole));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
            doThrow(new RuntimeException("Error de email")).when(emailService)
                    .enviarCodigoAlAdmin(anyString(), anyString(), anyString());

            ResponseEntity<?> result = authController.registerUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando rol por defecto no existe")
        void registerUser_ThrowsException_WhenDefaultRoleNotFound() {
            loginRequest.setRole(null);
            
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(encoder.encode(anyString())).thenReturn("encodedPassword");
            when(roleRepository.findByName(RoleName.ROLE_MOZO)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> authController.registerUser(loginRequest));
        }
    }

    // ============================================================
    // TESTS PARA verifyUser() - /verify
    // ============================================================
    @Nested
    @DisplayName("Tests para verifyUser() - /verify")
    class VerifyUserTests {

        @Test
        @DisplayName("Debe verificar cuenta correctamente con código válido")
        void verifyUser_VerifiesAccount_WhenCodeIsValid() {
            testUser.setVerificationCode("123456");
            testUser.setAccountNonLocked(false);
            loginRequest.setPassword("123456"); // El código de verificación

            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            ResponseEntity<?> result = authController.verifyUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            assertEquals("¡Cuenta verificada!", result.getBody());
            verify(userRepository).save(argThat(user -> 
                user.isAccountNonLocked() && user.getVerificationCode() == null));
        }

        @Test
        @DisplayName("Debe retornar error cuando usuario no existe")
        void verifyUser_ThrowsException_WhenUserNotFound() {
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class,
                    () -> authController.verifyUser(loginRequest));
        }

        @Test
        @DisplayName("Debe retornar error cuando cuenta ya está verificada")
        void verifyUser_ReturnsError_WhenAlreadyVerified() {
            testUser.setVerificationCode(null);
            
            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

            ResponseEntity<?> result = authController.verifyUser(loginRequest);

            assertEquals(400, result.getStatusCode().value());
            assertEquals("Error: Cuenta ya verificada.", result.getBody());
        }

        @Test
        @DisplayName("Debe retornar error cuando código es incorrecto")
        void verifyUser_ReturnsError_WhenCodeIsIncorrect() {
            testUser.setVerificationCode("123456");
            loginRequest.setPassword("654321"); // Código incorrecto

            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

            ResponseEntity<?> result = authController.verifyUser(loginRequest);

            assertEquals(400, result.getStatusCode().value());
            assertEquals("Error: Código incorrecto.", result.getBody());
        }

        @Test
        @DisplayName("Debe manejar espacios en blanco en el código")
        void verifyUser_HandlesWhitespaceInCode() {
            testUser.setVerificationCode(" 123456 ");
            loginRequest.setPassword("123456");

            when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            ResponseEntity<?> result = authController.verifyUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
        }
    }

    // ============================================================
    // TESTS PARA authenticateUser() - /login
    // ============================================================
    @Nested
    @DisplayName("Tests para authenticateUser() - /login")
    class AuthenticateUserTests {

        @Test
        @DisplayName("Debe autenticar usuario exitosamente")
        void authenticateUser_Success() {
            Authentication authentication = mock(Authentication.class);
            CustomUserDetails userDetails = mock(CustomUserDetails.class);
            Collection<GrantedAuthority> authorities = Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_MOZO"));

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(userDetails);
            when(jwtUtils.generateJwtToken(authentication)).thenReturn("jwt-token");
            when(userDetails.getId()).thenReturn(1L);
            when(userDetails.getUsername()).thenReturn("testuser");
            when(userDetails.getEmail()).thenReturn("test@test.com");
            doReturn(authorities).when(userDetails).getAuthorities();

            ResponseEntity<?> result = authController.authenticateUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            assertTrue(result.getBody() instanceof JwtResponse);
            JwtResponse jwtResponse = (JwtResponse) result.getBody();
            assertEquals("jwt-token", jwtResponse.getAccessToken());
        }

        @Test
        @DisplayName("Debe retornar 401 cuando cuenta está bloqueada")
        void authenticateUser_Returns401_WhenAccountLocked() {
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new LockedException("Cuenta bloqueada"));

            ResponseEntity<?> result = authController.authenticateUser(loginRequest);

            assertEquals(HttpStatus.UNAUTHORIZED.value(), result.getStatusCode().value());
            assertTrue(result.getBody().toString().contains("Cuenta no verificada"));
        }

        @Test
        @DisplayName("Debe retornar 400 cuando credenciales son inválidas")
        void authenticateUser_Returns400_WhenBadCredentials() {
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Credenciales inválidas"));

            ResponseEntity<?> result = authController.authenticateUser(loginRequest);

            assertEquals(400, result.getStatusCode().value());
            assertEquals("Error: Credenciales inválidas.", result.getBody());
        }

        @Test
        @DisplayName("Debe retornar múltiples roles correctamente")
        void authenticateUser_ReturnsMultipleRoles() {
            Authentication authentication = mock(Authentication.class);
            CustomUserDetails userDetails = mock(CustomUserDetails.class);
            Collection<GrantedAuthority> authorities = Arrays.asList(
                    new SimpleGrantedAuthority("ROLE_ADMIN"),
                    new SimpleGrantedAuthority("ROLE_MOZO"));

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(authentication);
            when(authentication.getPrincipal()).thenReturn(userDetails);
            when(jwtUtils.generateJwtToken(authentication)).thenReturn("jwt-token");
            when(userDetails.getId()).thenReturn(1L);
            when(userDetails.getUsername()).thenReturn("admin");
            when(userDetails.getEmail()).thenReturn("admin@test.com");
            doReturn(authorities).when(userDetails).getAuthorities();

            ResponseEntity<?> result = authController.authenticateUser(loginRequest);

            assertEquals(200, result.getStatusCode().value());
            JwtResponse jwtResponse = (JwtResponse) result.getBody();
            assertEquals(2, jwtResponse.getRoles().size());
            assertTrue(jwtResponse.getRoles().contains("ROLE_ADMIN"));
            assertTrue(jwtResponse.getRoles().contains("ROLE_MOZO"));
        }
    }
}
