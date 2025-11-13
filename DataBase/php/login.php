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
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email y contraseña son requeridos']);
        exit;
    }
    
    try {
        // Buscar usuario por email
        $stmt = $conn->prepare("SELECT id_usuario, nombre_completo, corre_electronico, contrasenia_hash, role FROM usuarios WHERE corre_electronico = ? AND status = 'Activo'");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            // Verificar contraseña
            if (password_verify($password, $user['contrasenia_hash'])) {
                // Login exitoso - determinar redirección
                $redirect = 'index.html';
                if ($user['role'] === 'Doctor') {
                    $redirect = 'doctorIndex.html';
                } elseif ($user['role'] === 'Administrador') {
                    $redirect = 'admin.html';
                } elseif ($user['role'] === 'Paciente') {
                    $redirect = 'index.html';
                }
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Login exitoso', 
                    'redirect' => $redirect,
                    'user' => [
                        'id' => $user['id_usuario'],
                        'name' => $user['nombre_completo'],
                        'email' => $user['corre_electronico'],
                        'role' => $user['role']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado o cuenta inactiva']);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
    
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>