package com.example.Proyect_ing_soft.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // Leemos tu correo desde application.properties para usarlo como remitente y destinatario
    // Asegúrate de que en application.properties tengas: spring.mail.username=tucorreo@gmail.com
    @Value("${spring.mail.username}")
    private String adminEmail;

    public void enviarCodigoAlAdmin(String nuevoUsuario, String rolSolicitado, String codigo) {
        // Log de inicio para depuración
        System.out.println(">>> 1. INICIANDO SERVICIO DE EMAIL..."); 
        System.out.println(">>> Destinatario (Admin): " + adminEmail);

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

            // Enviar
            mailSender.send(message);
            
            // Log de éxito
            System.out.println(">>> 2. ¡CORREO ENVIADO CON ÉXITO A GMAIL!"); 

        } catch (Exception e) {
            // Log de error detallado por si falla
            System.err.println(">>> 3. ERROR FATAL ENVIANDO CORREO:"); 
            e.printStackTrace(); 
        }
    }
}