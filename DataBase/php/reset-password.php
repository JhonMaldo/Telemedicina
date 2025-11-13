<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $email = $data['email'] ?? '';
    $codigo = $data['codigo'] ?? '';
    $nueva_password = $data['nueva_password'] ?? '';
    
    if (empty($email) || empty($codigo) || empty($nueva_password)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        exit;
    }
    
    // Verificar código de recuperación
    $stmt = $conn->prepare("SELECT id FROM codigos_recuperacion WHERE email = ? AND codigo = ? AND expiracion > NOW() AND usado = 0");
    $stmt->bind_param("ss", $email, $codigo);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        // Código válido, actualizar contraseña
        $password_hash = password_hash($nueva_password, PASSWORD_DEFAULT);
        
        $update_stmt = $conn->prepare("UPDATE usuarios SET contrasenia_hash = ? WHERE corre_electronico = ?");
        $update_stmt->bind_param("ss", $password_hash, $email);
        
        if ($update_stmt->execute()) {
            // Marcar código como usado
            $mark_stmt = $conn->prepare("UPDATE codigos_recuperacion SET usado = 1 WHERE email = ? AND codigo = ?");
            $mark_stmt->bind_param("ss", $email, $codigo);
            $mark_stmt->execute();
            $mark_stmt->close();
            
            echo json_encode(['success' => true, 'message' => 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña']);
        }
        
        $update_stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Código inválido, expirado o ya utilizado']);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>