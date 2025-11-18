<?php
require_once 'conexion.php';

// Habilitar errores para depuración
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log para verificar que el script se está ejecutando
file_put_contents('debug.log', "Register script accessed: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_type = $_POST['user_type'] ?? '';
    
    file_put_contents('debug.log', "User type: " . $user_type . "\n", FILE_APPEND);
    file_put_contents('debug.log', "POST data: " . print_r($_POST, true) . "\n", FILE_APPEND);
    
    // Validar tipo de usuario
    if (!in_array($user_type, ['patient', 'doctor', 'admin'])) {
        $response = ['success' => false, 'message' => 'Tipo de usuario inválido: ' . $user_type];
        echo json_encode($response);
        exit;
    }
    
    try {
        switch ($user_type) {
            case 'patient':
                registerPatient($conn);
                break;
            case 'doctor':
                registerDoctor($conn);
                break;
            case 'admin':
                registerAdmin($conn);
                break;
        }
    } catch (Exception $e) {
        $response = ['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()];
        echo json_encode($response);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

function registerPatient($conn) {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $birthdate = $_POST['birthdate'] ?? '';
    $gender = $_POST['gender'] ?? '';
    $password = $_POST['password'] ?? '';
    
    file_put_contents('debug.log', "Patient data - Name: $name, Email: $email\n", FILE_APPEND);
    
    // Validaciones básicas
    if (empty($name) || empty($email) || empty($phone) || empty($birthdate) || empty($gender) || empty($password)) {
        $response = ['success' => false, 'message' => 'Todos los campos son requeridos'];
        echo json_encode($response);
        return;
    }
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id FROM paciente WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $response = ['success' => false, 'message' => 'El email ya está registrado'];
        echo json_encode($response);
        $stmt->close();
        return;
    }
    $stmt->close();
    
    // Encriptar contraseña
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insertar paciente
    $stmt = $conn->prepare("INSERT INTO paciente (nombre_completo, email, telefono, fecha_nacimiento, genero, password) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $name, $email, $phone, $birthdate, $gender, $hashed_password);
    
    if ($stmt->execute()) {
        file_put_contents('debug.log', "Patient registered successfully: $email\n", FILE_APPEND);
        $response = ['success' => true, 'message' => 'Registro exitoso', 'redirect' => 'login.html'];
    } else {
        $error = $stmt->error;
        file_put_contents('debug.log', "Database error: $error\n", FILE_APPEND);
        $response = ['success' => false, 'message' => 'Error al registrar usuario: ' . $error];
    }
    
    $stmt->close();
    echo json_encode($response);
}

// ... (las otras funciones registerDoctor y registerAdmin similares)
?>