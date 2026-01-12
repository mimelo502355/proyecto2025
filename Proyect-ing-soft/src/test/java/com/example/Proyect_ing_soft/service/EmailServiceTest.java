package com.example.Proyect_ing_soft.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Suite de Tests de Caja Blanca para EmailService
 * Cobertura: 100% de caminos de ejecución y manejo de excepciones
 */
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "adminEmail", "admin@elpicante.com");
    }

    @Nested
    @DisplayName("Tests para enviarCodigoAlAdmin()")
    class EnviarCodigoAlAdminTests {

        @Test
        @DisplayName("Debe enviar email correctamente con todos los parámetros")
        void enviarCodigoAlAdmin_SendsEmailSuccessfully() {
            doNothing().when(mailSender).send(any(SimpleMailMessage.class));

            assertDoesNotThrow(() -> 
                emailService.enviarCodigoAlAdmin("nuevoUsuario", "mozo", "123456"));

            verify(mailSender).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("Debe configurar remitente y destinatario con adminEmail")
        void enviarCodigoAlAdmin_SetsCorrectFromAndTo() {
            ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            doNothing().when(mailSender).send(messageCaptor.capture());

            emailService.enviarCodigoAlAdmin("testUser", "admin", "654321");

            SimpleMailMessage capturedMessage = messageCaptor.getValue();
            assertEquals("admin@elpicante.com", capturedMessage.getFrom());
            assertArrayEquals(new String[]{"admin@elpicante.com"}, capturedMessage.getTo());
        }

        @Test
        @DisplayName("Debe incluir username en el asunto")
        void enviarCodigoAlAdmin_IncludesUsernameInSubject() {
            ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            doNothing().when(mailSender).send(messageCaptor.capture());

            emailService.enviarCodigoAlAdmin("juanperez", "cocina", "111111");

            SimpleMailMessage capturedMessage = messageCaptor.getValue();
            assertTrue(capturedMessage.getSubject().contains("juanperez"));
            assertTrue(capturedMessage.getSubject().contains("NUEVO REGISTRO"));
        }

        @Test
        @DisplayName("Debe incluir rol solicitado en el cuerpo")
        void enviarCodigoAlAdmin_IncludesRoleInBody() {
            ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            doNothing().when(mailSender).send(messageCaptor.capture());

            emailService.enviarCodigoAlAdmin("maria", "cocina", "222222");

            SimpleMailMessage capturedMessage = messageCaptor.getValue();
            assertTrue(capturedMessage.getText().contains("cocina"));
            assertTrue(capturedMessage.getText().contains("maria"));
        }

        @Test
        @DisplayName("Debe incluir código de verificación en el cuerpo")
        void enviarCodigoAlAdmin_IncludesVerificationCode() {
            ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            doNothing().when(mailSender).send(messageCaptor.capture());

            emailService.enviarCodigoAlAdmin("pedro", "mozo", "987654");

            SimpleMailMessage capturedMessage = messageCaptor.getValue();
            assertTrue(capturedMessage.getText().contains("987654"));
            assertTrue(capturedMessage.getText().contains("CÓDIGO DE ACCESO"));
        }

        @Test
        @DisplayName("Debe lanzar RuntimeException cuando JavaMailSender falla")
        void enviarCodigoAlAdmin_ThrowsException_WhenMailSenderFails() {
            doThrow(new RuntimeException("Error de conexión SMTP"))
                    .when(mailSender).send(any(SimpleMailMessage.class));

            RuntimeException exception = assertThrows(RuntimeException.class,
                    () -> emailService.enviarCodigoAlAdmin("user", "admin", "123456"));

            assertTrue(exception.getMessage().contains("Error enviando email de verificación"));
        }

        @Test
        @DisplayName("Debe funcionar con diferentes roles")
        void enviarCodigoAlAdmin_WorksWithDifferentRoles() {
            doNothing().when(mailSender).send(any(SimpleMailMessage.class));

            assertDoesNotThrow(() -> emailService.enviarCodigoAlAdmin("user1", "admin", "111111"));
            assertDoesNotThrow(() -> emailService.enviarCodigoAlAdmin("user2", "mozo", "222222"));
            assertDoesNotThrow(() -> emailService.enviarCodigoAlAdmin("user3", "cocina", "333333"));

            verify(mailSender, times(3)).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("Debe manejar código con espacios")
        void enviarCodigoAlAdmin_HandlesCodeWithSpaces() {
            ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
            doNothing().when(mailSender).send(messageCaptor.capture());

            emailService.enviarCodigoAlAdmin("user", "mozo", " 123456 ");

            SimpleMailMessage capturedMessage = messageCaptor.getValue();
            assertTrue(capturedMessage.getText().contains(" 123456 "));
        }
    }
}
