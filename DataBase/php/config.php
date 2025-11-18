<?php
// config.php - Configuración para PHPMailer

// Configuración SMTP para Gmail (ejemplo)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_USER', 'tu_email@gmail.com');  // Tu email
define('SMTP_PASS', 'tu_password_de_aplicacion');  // Password de aplicación
define('SMTP_SECURE', 'tls');
define('SMTP_PORT', 587);

// Información del remitente
define('FROM_EMAIL', 'tu_email@gmail.com');
define('FROM_NAME', 'Sistema Médico Telemedicina');

// Para Gmail necesitas habilitar:
// 1. Verificación en 2 pasos
// 2. Generar una "Contraseña de aplicación"
?>