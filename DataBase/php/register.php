<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
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
        echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
        $check_stmt->close();
        exit;
    }
    $check_stmt->close();
    
    // Hash de la contraseña
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Determinar el rol según tu ENUM
    if ($tipo === 'doctor') {
        $role = 'Doctor';
    } elseif ($tipo === 'admin') {
        $role = 'Administrador';
    } else {
        $role = 'Paciente';
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
            if ($genero === 'male') $genero_db = 'M';  // ✅ CORRECTO
            elseif ($genero === 'female') $genero_db = 'F';  // ✅ CORRECTO
            else $genero_db = 'M';
            
            // Buscar el último ID de paciente para continuar la secuencia
            $last_patient = $conn->query("SELECT MAX(id_paciente) as max_id FROM pacientes");
            $last_id = 1; // Valor por defecto
            if ($last_patient && $row = $last_patient->fetch_assoc()) {
                $last_id = $row['max_id'] ? $row['max_id'] + 1 : 1;
            }
            
            // Campos adicionales para pacientes
            $direccion = $data['direccion'] ?? null;
            $contacto_emergencia = $data['contacto_emergencia'] ?? null;
            
            $paciente_stmt = $conn->prepare("INSERT INTO pacientes (id_paciente, id_usuario, fecha_nacimiento, genero, telefono_paciente, direccion, contacto_de_emergencia) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $paciente_stmt->bind_param("iisssss", $last_id, $user_id, $fecha_nacimiento, $genero_db, $telefono, $direccion, $contacto_emergencia);
            
            if ($paciente_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Registro exitoso como paciente']);
            } else {
                // Si hay error, eliminar el usuario creado
                $conn->query("DELETE FROM usuarios WHERE id_usuario = $user_id");
                echo json_encode(['success' => false, 'message' => 'Error al crear perfil de paciente: ' . $paciente_stmt->error]);
            }
            $paciente_stmt->close();
            
        } elseif ($tipo === 'doctor') {
            $especialidad = $data['especialidad'] ?? '';
            $licencia = $data['licencia'] ?? '';
            
            // Buscar el último ID de doctor para continuar la secuencia
            $last_doctor = $conn->query("SELECT MAX(id_doctor) as max_id FROM doctores");
            $last_id = 1; // Valor por defecto
            if ($last_doctor && $row = $last_doctor->fetch_assoc()) {
                $last_id = $row['max_id'] ? $row['max_id'] + 1 : 1;
            }
            
            // Campos adicionales para doctores
            $bio = $data['bio'] ?? null;
            
            $doctor_stmt = $conn->prepare("INSERT INTO doctores (id_doctor, id_usuario, numero_licencia, especialidad, bio, telefono_doctor) VALUES (?, ?, ?, ?, ?, ?)");
            $doctor_stmt->bind_param("iissss", $last_id, $user_id, $licencia, $especialidad, $bio, $telefono);
            
            if ($doctor_stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Registro exitoso como doctor']);
            } else {
                // Si hay error, eliminar el usuario creado
                $conn->query("DELETE FROM usuarios WHERE id_usuario = $user_id");
                echo json_encode(['success' => false, 'message' => 'Error al crear perfil de doctor: ' . $doctor_stmt->error]);
            }
            $doctor_stmt->close();
        } else {
            // Para administradores, solo creamos el usuario en la tabla usuarios
            echo json_encode(['success' => true, 'message' => 'Registro exitoso como administrador']);
        }
        
    } else {
        echo json_encode(['success' => false, 'message' => 'Error en el registro: ' . $stmt->error]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>