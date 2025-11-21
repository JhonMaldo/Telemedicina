<?php
<<<<<<< HEAD
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
=======
header('Content-Type: application/json');
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $tipo = $data['tipo'] ?? '';
    $nombre = $data['nombre'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $telefono = $data['telefono'] ?? '';
    
    // Validaciones básicas
    if (empty($tipo) || empty($nombre) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        exit;
    }
    
    // Verificar si el email ya existe
    $check_stmt = $conn->prepare("SELECT id_usuario FROM usuarios WHERE corre_electronico = ?");
    $check_stmt->bind_param("s", $email);
    $check_stmt->execute();
    
    if ($check_stmt->get_result()->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => '❌ El email ya está registrado']);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();
    
    // Hash de la contraseña
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Determinar el rol según el tipo - CORREGIDO para que coincida con login
    if ($tipo === 'doctor') {
        $role = 'Doctor';
    } elseif ($tipo === 'admin') {
        $role = 'Administrador';
    } else {
        $role = 'Paciente';  // ← Ahora es 'Paciente' en lugar de 'patient'
    }
    
    // Insertar usuario en la tabla usuarios
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre_completo, corre_electronico, contrasenia_hash, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $nombre, $email, $password_hash, $role);
    
    if ($stmt->execute()) {
        $user_id = $stmt->insert_id;
        
        // Insertar en la tabla específica según el tipo
        if ($tipo === 'paciente') {
            $fecha_nacimiento = $data['fecha_nacimiento'] ?? null;
            $genero = $data['genero'] ?? null;
            
            // Convertir género al formato de tu ENUM (M/F)
            $genero_db = '';
            if ($genero === 'male') $genero_db = 'M';
            elseif ($genero === 'female') $genero_db = 'F';
            else $genero_db = 'M';
            
            // Buscar el último ID de paciente
            $last_patient = $conn->query("SELECT MAX(id_paciente) as max_id FROM pacientes");
            $last_id = 1;
            if ($last_patient && $row = $last_patient->fetch_assoc()) {
                $last_id = $row['max_id'] ? $row['max_id'] + 1 : 1;
            }
            
            $direccion = $data['direccion'] ?? null;
            $contacto_emergencia = $data['contacto_emergencia'] ?? null;
            
            $paciente_stmt = $conn->prepare("INSERT INTO pacientes (id_paciente, id_usuario, fecha_nacimiento, genero, telefono_paciente, direccion, contacto_de_emergencia) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $paciente_stmt->bind_param("iisssss", $last_id, $user_id, $fecha_nacimiento, $genero_db, $telefono, $direccion, $contacto_emergencia);
            
            if ($paciente_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => '✅ Registro exitoso como paciente']);
            } else {
                $conn->query("DELETE FROM usuarios WHERE id_usuario = $user_id");
                echo json_encode(['success' => false, 'message' => '❌ Error al crear perfil de paciente: ' . $paciente_stmt->error]);
            }
            $paciente_stmt->close();
            
        } elseif ($tipo === 'doctor') {
            $especialidad = $data['especialidad'] ?? '';
            $licencia = $data['licencia'] ?? '';
            
            // Buscar el último ID de doctor
            $last_doctor = $conn->query("SELECT MAX(id_doctor) as max_id FROM doctores");
            $last_id = 1;
            if ($last_doctor && $row = $last_doctor->fetch_assoc()) {
                $last_id = $row['max_id'] ? $row['max_id'] + 1 : 1;
            }
            
            $bio = $data['bio'] ?? null;
            
            $doctor_stmt = $conn->prepare("INSERT INTO doctores (id_doctor, id_usuario, numero_licencia, especialidad, bio, telefono_doctor) VALUES (?, ?, ?, ?, ?, ?)");
            $doctor_stmt->bind_param("iissss", $last_id, $user_id, $licencia, $especialidad, $bio, $telefono);
            
            if ($doctor_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => '✅ Registro exitoso como doctor']);
            } else {
                $conn->query("DELETE FROM usuarios WHERE id_usuario = $user_id");
                echo json_encode(['success' => false, 'message' => '❌ Error al crear perfil de doctor: ' . $doctor_stmt->error]);
            }
            $doctor_stmt->close();
        } else {
            // Para administradores, solo creamos el usuario
            echo json_encode(['success' => true, 'message' => '✅ Registro exitoso como administrador']);
        }
        
    } else {
        echo json_encode(['success' => false, 'message' => '❌ Error en el registro: ' . $stmt->error]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
>>>>>>> origin/master
?>