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
    // ID del doctor hardcodeado por ahora
    $id_doctor_logueado = 101; 

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