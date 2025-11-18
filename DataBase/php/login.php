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
    $tipo_solicitado = $data['tipo'] ?? ''; // Nuevo: tipo de login solicitado
    
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
                
                // ========== VALIDACIÓN DE ROL ==========
                $rol_usuario = $user['role'];
                $tipo_solicitado = strtolower($tipo_solicitado);
                
                // Mapear tipos solicitados a roles de BD
                $roles_permitidos = [
                    'patient' => 'Paciente',
                    'doctor' => 'Doctor', 
                    'admin' => 'Administrador'
                ];
                
                $rol_solicitado = $roles_permitidos[$tipo_solicitado] ?? '';
                
                // Verificar si el rol del usuario coincide con el tipo solicitado
                if ($rol_usuario !== $rol_solicitado) {
                    $mensajes_error = [
                        'Paciente' => '❌ No tienes permisos para acceder como paciente. Tu rol es: ' . $rol_usuario,
                        'Doctor' => '❌ No tienes permisos para acceder como doctor. Tu rol es: ' . $rol_usuario,
                        'Administrador' => '❌ No tienes permisos para acceder como administrador. Tu rol es: ' . $rol_usuario
                    ];
                    
                    echo json_encode([
                        'success' => false, 
                        'message' => $mensajes_error[$rol_solicitado] ?? '❌ Tipo de acceso no válido'
                    ]);
                    exit;
                }
                
                // ========== LOGIN EXITOSO ==========
                // Determinar redirección según el rol
                $redirect = 'index.html'; // Por defecto
                if ($rol_usuario === 'Doctor') {
                    $redirect = 'doctorIndex.html';
                } elseif ($rol_usuario === 'Administrador') {
                    $redirect = 'admin.html';
                } elseif ($rol_usuario === 'Paciente') {
                    $redirect = 'index.html';
                }
                
                echo json_encode([
                    'success' => true, 
                    'message' => '✅ Login exitoso como ' . $rol_usuario,
                    'redirect' => $redirect,
                    'user' => [
                        'id' => $user['id_usuario'],
                        'name' => $user['nombre_completo'],
                        'email' => $user['corre_electronico'],
                        'role' => $user['role']
                    ]
                ]);
                
            } else {
                echo json_encode(['success' => false, 'message' => '❌ Contraseña incorrecta']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => '❌ Usuario no encontrado o cuenta inactiva']);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => '❌ Error del servidor: ' . $e->getMessage()]);
    }
    
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>