<?php
// DataBase/php/recuperar-simple.php - VERSIÓN SIMPLE CON mail()
// Activamos el reporte de errores para verlos en el log, pero no los mostramos al usuario
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Incluir conexión
require_once 'conexion.php';

// Función para enviar respuesta JSON y terminar
function sendJsonResponse($success, $message, $codigo = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($codigo) {
        $response['codigo'] = $codigo;
    }
    echo json_encode($response);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJsonResponse(false, 'Método no permitido');
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendJsonResponse(false, 'Error: JSON inválido en la petición');
    }
    
    $email = $data['email'] ?? '';
    
    if (empty($email)) {
        sendJsonResponse(false, 'Email es requerido');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(false, 'Formato de email inválido');
    }
    
    // Verificar si el email existe
    $stmt = $conn->prepare("SELECT id_usuario, nombre_completo FROM usuarios WHERE corre_electronico = ? AND status = 'Activo'");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows !== 1) {
        sendJsonResponse(false, 'Email no encontrado en nuestro sistema');
    }
    
    $user = $result->fetch_assoc();
    
    // Generar código de recuperación
    $codigo_recuperacion = sprintf("%06d", mt_rand(1, 999999));
    $expiracion = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Limpiar códigos anteriores
    $clean_stmt = $conn->prepare("DELETE FROM codigos_recuperacion WHERE email = ? OR expiracion < NOW()");
    $clean_stmt->bind_param("s", $email);
    $clean_stmt->execute();
    $clean_stmt->close();
    
    // Guardar código en la base de datos
    $codigo_stmt = $conn->prepare("INSERT INTO codigos_recuperacion (email, codigo, expiracion) VALUES (?, ?, ?)");
    $codigo_stmt->bind_param("sss", $email, $codigo_recuperacion, $expiracion);
    
    if (!$codigo_stmt->execute()) {
        sendJsonResponse(false, 'Error al generar el código de recuperación');
    }
    
    $codigo_stmt->close();
    
    // Intentar enviar email con mail()
    $asunto = "Código de Recuperación - Sistema Médico Telemedicina";
    $mensaje = "
    Hola {$user['nombre_completo']},

    Has solicitado restablecer tu contraseña en Sistema Médico Telemedicina.

    TU CÓDIGO DE VERIFICACIÓN ES: {$codigo_recuperacion}

    Este código expirará en 1 hora.

    Si no solicitaste este código, por favor ignora este mensaje.

    Atentamente,
    El equipo de Sistema Médico Telemedicina
    ";
    
    $headers = "From: sistema@telemedicina.com\r\n";
    $headers .= "Reply-To: sistema@telemedicina.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // Intentar enviar email
    $email_enviado = mail($email, $asunto, $mensaje, $headers);
    
    if ($email_enviado) {
        sendJsonResponse(true, '✅ Código de recuperación enviado a tu email. Revisa tu bandeja de entrada.');
    } else {
        // Si falla el email, mostrar el código (solo en desarrollo)
        sendJsonResponse(true, '✅ Código de recuperación: ' . $codigo_recuperacion . ' (Email no enviado - usa este código)', $codigo_recuperacion);
    }

} catch (Exception $e) {
    error_log("Error en recuperar-simple.php: " . $e->getMessage());
    sendJsonResponse(false, '❌ Error del servidor');
}
?>