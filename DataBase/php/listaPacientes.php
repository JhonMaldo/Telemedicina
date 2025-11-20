<?php
// listaPacientes.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir conexión desde la carpeta bd
include 'conexion.php';

// Para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Obtener ID del usuario desde el frontend
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $id_usuario = $data['id_usuario'] ?? null;

    if (!$id_usuario) {
        echo json_encode(["error" => "Se requiere el ID del usuario"]);
        exit;
    }

    // Obtener id_doctor del usuario
    $sql_doctor = "SELECT id_doctor FROM doctores WHERE id_usuario = ?";
    $stmt_doctor = $conn->prepare($sql_doctor);
    $stmt_doctor->bind_param("i", $id_usuario);
    $stmt_doctor->execute();
    $result_doctor = $stmt_doctor->get_result();
    
    if ($result_doctor->num_rows === 0) {
        echo json_encode(["error" => "Usuario no es un doctor válido"]);
        exit;
    }
    
    $doctor = $result_doctor->fetch_assoc();
    $id_doctor_logueado = $doctor['id_doctor'];
    $stmt_doctor->close();

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
        throw new Exception("Error preparando la consulta: " . $conn->error);
    }
    
    $stmt->bind_param("i", $id_doctor_logueado);
    $stmt->execute();
    $resultado = $stmt->get_result();

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

    if (empty($pacientes)) {
        echo json_encode(["message" => "No se encontraron pacientes"]);
    } else {
        echo json_encode($pacientes);
    }
    
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en el servidor: " . $e->getMessage()]);
}

$conn->close();
?>