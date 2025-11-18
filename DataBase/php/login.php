<?php
session_start();
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $user_type = $_POST['user_type'];
    
    // Validar campos
    if (empty($email) || empty($password) || empty($user_type)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        exit;
    }
    
    // Determinar la tabla según el tipo de usuario
    $table = '';
    switch ($user_type) {
        case 'patient':
            $table = 'paciente';
            break;
        case 'doctor':
            $table = 'doctor';
            break;
        case 'admin':
            $table = 'admin';
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Tipo de usuario inválido']);
            exit;
    }
    
    try {
        // Buscar usuario por email
        $stmt = $conn->prepare("SELECT id, nombre_completo, password, activo FROM $table WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $user = $result->fetch_assoc();
            
            // Verificar si la cuenta está activa
            if (!$user['activo']) {
                echo json_encode(['success' => false, 'message' => 'Esta cuenta está desactivada']);
                exit;
            }
            
            // Verificar contraseña (en producción debería estar encriptada)
            if (password_verify($password, $user['password'])) {
                // Crear sesión
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['nombre_completo'];
                $_SESSION['user_type'] = $user_type;
                $_SESSION['user_email'] = $email;
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Login exitoso', 
                    'redirect' => $user_type . '.html'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

$conn->close();
?>