package com.example.Proyect_ing_soft.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String adminEmail;

    public void enviarCodigoAlAdmin(String nuevoUsuario, String rolSolicitado, String codigo) {
        logger.info("Iniciando envío de email de verificación para usuario: {}", nuevoUsuario);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            
            // Configuración del correo
            message.setFrom(adminEmail); // Lo envía tu cuenta
            message.setTo(adminEmail);   // Te llega a TI MISMO (al admin)
            message.setSubject("🔔 NUEVO REGISTRO: " + nuevoUsuario);
            
            // Cuerpo del mensaje
            String cuerpo = "Hola Admin,\n\n" +
                            "Un nuevo usuario intenta registrarse en el sistema:\n" +
                            "--------------------------------------------------\n" +
                            "👤 Usuario: " + nuevoUsuario + "\n" +
                            "🍳 Cargo solicitado: " + rolSolicitado + "\n" +
                            "--------------------------------------------------\n\n" +
                            "Si autorizas su ingreso, entrégale el siguiente código:\n" +
                            "👉 CÓDIGO DE ACCESO: " + codigo + "\n\n" +
                            "Saludos,\nSistema El Picante";
            
            message.setText(cuerpo);

            mailSender.send(message);
            logger.info("Email de verificación enviado exitosamente para usuario: {}", nuevoUsuario);

        } catch (Exception e) {
            logger.error("Error enviando email de verificación para usuario: {}", nuevoUsuario, e);
            throw new RuntimeException("Error enviando email de verificación", e);
        }
    }
}