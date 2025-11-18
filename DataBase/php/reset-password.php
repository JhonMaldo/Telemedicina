<?php
// DataBase/php/reset-password.php - VERSIÓN CON MÁS DEBUG
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'conexion.php';

// Función para enviar JSON con debug
function sendJson($success, $message, $debug = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($debug !== null) {
        $response['debug'] = $debug;
    }
    echo json_encode($response);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJson(false, 'Método no permitido');
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data === null) {
        sendJson(false, 'Error: JSON inválido en la petición');
    }
    
    $email = trim($data['email'] ?? '');
    $codigo = trim($data['codigo'] ?? '');
    $nueva_password = $data['nueva_password'] ?? '';
    
    error_log("Reset Password - Email: '$email', Código: '$codigo'");
    
    if (empty($email) || empty($codigo) || empty($nueva_password)) {
        sendJson(false, 'Todos los campos son requeridos');
    }
    
    if (strlen($nueva_password) < 8) {
        sendJson(false, 'La contraseña debe tener al menos 8 caracteres');
    }
    
    // Verificar código de recuperación
    $stmt = $conn->prepare("SELECT id, email, codigo, expiracion, usado FROM codigos_recuperacion WHERE email = ? AND codigo = ? AND usado = 0");
    $stmt->bind_param("ss", $email, $codigo);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Verificar por qué falló
        $check_stmt = $conn->prepare("SELECT id, usado, expiracion < NOW() as expirado FROM codigos_recuperacion WHERE email = ? AND codigo = ?");
        $check_stmt->bind_param("ss", $email, $codigo);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        
        $debug_info = [];
        if ($check_result->num_rows > 0) {
            $row = $check_result->fetch_assoc();
            $debug_info = $row;
            if ($row['usado'] == 1) {
                sendJson(false, '❌ Este código ya fue utilizado', $debug_info);
            } else if ($row['expirado'] == 1) {
                sendJson(false, '❌ Este código ha expirado', $debug_info);
            } else {
                sendJson(false, '❌ Código no válido', $debug_info);
            }
        } else {
            sendJson(false, '❌ Código no encontrado para este email', $debug_info);
        }
        $check_stmt->close();
        exit;
    }
    
    $codigo_data = $result->fetch_assoc();
    $stmt->close();
    
    // Verificar expiración
    if (strtotime($codigo_data['expiracion']) < time()) {
        sendJson(false, '❌ El código ha expirado', ['expiracion' => $codigo_data['expiracion']]);
    }
    
    // Código válido, actualizar contraseña
    $password_hash = password_hash($nueva_password, PASSWORD_DEFAULT);
    
    $update_stmt = $conn->prepare("UPDATE usuarios SET contrasenia_hash = ? WHERE corre_electronico = ?");
    $update_stmt->bind_param("ss", $password_hash, $email);
    
    if ($update_stmt->execute()) {
        $affected_rows = $update_stmt->affected_rows;
        $update_stmt->close();
        
        if ($affected_rows > 0) {
            // Marcar código como usado
            $mark_stmt = $conn->prepare("UPDATE codigos_recuperacion SET usado = 1 WHERE email = ? AND codigo = ?");
            $mark_stmt->bind_param("ss", $email, $codigo);
            $mark_stmt->execute();
            $mark_stmt->close();
            
            sendJson(true, '✅ Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.', ['affected_rows' => $affected_rows]);
        } else {
            sendJson(false, '❌ No se pudo actualizar la contraseña. El email puede no existir.', ['affected_rows' => $affected_rows]);
        }
    } else {
        $error = $update_stmt->error;
        $update_stmt->close();
        sendJson(false, '❌ Error al actualizar la contraseña en la base de datos: ' . $error);
    }

} catch (Exception $e) {
    error_log("Error en reset-password.php: " . $e->getMessage());
    sendJson(false, '❌ Error del servidor: ' . $e->getMessage());
}
?>