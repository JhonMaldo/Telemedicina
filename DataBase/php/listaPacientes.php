<?php
// listaPacientes.php - CON DEBUGGING

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir conexión desde la carpeta bd
include 'conexion.php';

// Para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ⬇️⬇️⬇️ DEBUGGING TEMPORAL ⬇️⬇️⬇️
file_put_contents('debug_log.txt', "=== INICIO listaPacientes.php ===\n", FILE_APPEND);
file_put_contents('debug_log.txt', "Método: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

try {
    // Obtener datos del POST
    $input = file_get_contents('php://input');
    file_put_contents('debug_log.txt', "Input recibido: " . $input . "\n", FILE_APPEND);
    
    $data = json_decode($input, true);
    $id_usuario = $data['id_usuario'] ?? null;

    file_put_contents('debug_log.txt', "id_usuario: " . $id_usuario . "\n", FILE_APPEND);

    if (!$id_usuario) {
        $error = "Se requiere el ID del usuario";
        file_put_contents('debug_log.txt', "ERROR: " . $error . "\n", FILE_APPEND);
        echo json_encode(["error" => $error]);
        exit;
    }

    // Obtener id_doctor del usuario
    $sql_doctor = "SELECT id_doctor FROM doctores WHERE id_usuario = ?";
    $stmt_doctor = $conn->prepare($sql_doctor);
    
    if (!$stmt_doctor) {
        $error = "Error preparando consulta de doctor: " . $conn->error;
        file_put_contents('debug_log.txt', "ERROR: " . $error . "\n", FILE_APPEND);
        throw new Exception($error);
    }
    
    $stmt_doctor->bind_param("i", $id_usuario);
    $stmt_doctor->execute();
    $result_doctor = $stmt_doctor->get_result();
    
    file_put_contents('debug_log.txt', "Filas encontradas en doctores: " . $result_doctor->num_rows . "\n", FILE_APPEND);
    
    if ($result_doctor->num_rows === 0) {
        $error = "Usuario no es un doctor válido. id_usuario: " . $id_usuario;
        file_put_contents('debug_log.txt', "ERROR: " . $error . "\n", FILE_APPEND);
        echo json_encode(["error" => $error]);
        exit;
    }
    
    $doctor = $result_doctor->fetch_assoc();
    $id_doctor_logueado = $doctor['id_doctor'];
    $stmt_doctor->close();

    file_put_contents('debug_log.txt', "id_doctor encontrado: " . $id_doctor_logueado . "\n", FILE_APPEND);

    // Consulta principal
    $sql = "SELECT DISTINCT 
                p.id_paciente, 
                u.nombre_completo,
                p.fecha_nacimiento,
                p.genero,
                p.telefono_paciente
            FROM pacientes p
            JOIN usuarios u ON p.id_usuario = u.id_usuario
            JOIN citas c ON p.id_paciente = c.id_paciente
            WHERE c.id_doctor = ?
            ORDER BY u.nombre_completo ASC";

    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        $error = "Error preparando la consulta: " . $conn->error;
        file_put_contents('debug_log.txt', "ERROR: " . $error . "\n", FILE_APPEND);
        throw new Exception($error);
    }
    
    $stmt->bind_param("i", $id_doctor_logueado);
    $stmt->execute();
    $resultado = $stmt->get_result();

    file_put_contents('debug_log.txt', "Filas encontradas en pacientes: " . $resultado->num_rows . "\n", FILE_APPEND);

    $pacientes = [];
    while ($fila = $resultado->fetch_assoc()) {
        // Calcular edad
        if ($fila['fecha_nacimiento']) {
            $fecha_nac = new DateTime($fila['fecha_nacimiento']);
            $hoy = new DateTime();
            $edad = $hoy->diff($fecha_nac)->y;
            $fila['edad'] = $edad;
        } else {
            $fila['edad'] = 'N/A';
        }
        
        $pacientes[] = $fila;
    }

    file_put_contents('debug_log.txt', "Pacientes a enviar: " . count($pacientes) . "\n", FILE_APPEND);
    file_put_contents('debug_log.txt', "=== FIN listaPacientes.php ===\n\n", FILE_APPEND);

    if (empty($pacientes)) {
        echo json_encode(["message" => "No se encontraron pacientes"]);
    } else {
        echo json_encode($pacientes);
    }
    
    $stmt->close();

} catch (Exception $e) {
    file_put_contents('debug_log.txt', "EXCEPCIÓN: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(["error" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>