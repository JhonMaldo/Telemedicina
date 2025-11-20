<?php
// perfilPaciente.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir conexión desde la carpeta bd
include 'conexion.php';

// Para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

// ⬇️⬇️⬇️ MODIFICADO: Obtener ID del paciente y del usuario ⬇️⬇️⬇️
$id_paciente = isset($_GET['id']) ? intval($_GET['id']) : 0;
$id_usuario = isset($_GET['id_usuario']) ? intval($_GET['id_usuario']) : 0;

if ($id_paciente == 0 || $id_usuario == 0) {
    http_response_code(400);
    echo json_encode(["error" => "Datos inválidos: se requiere ID de paciente y usuario"]);
    exit;
}

$respuesta = [];

try {
    // ⬇️⬇️⬇️ NUEVO: Validar que el doctor tiene acceso a este paciente ⬇️⬇️⬇️
    $sql_validate = "SELECT d.id_doctor 
                     FROM doctores d 
                     INNER JOIN citas c ON d.id_doctor = c.id_doctor 
                     WHERE d.id_usuario = ? AND c.id_paciente = ? 
                     LIMIT 1";
    $stmt_validate = $conn->prepare($sql_validate);
    if (!$stmt_validate) {
        throw new Exception("Error preparando validación: " . $conn->error);
    }
    
    $stmt_validate->bind_param("ii", $id_usuario, $id_paciente);
    $stmt_validate->execute();
    $result_validate = $stmt_validate->get_result();
    
    if ($result_validate->num_rows === 0) {
        http_response_code(403);
        echo json_encode(["error" => "No tienes permisos para acceder a este expediente"]);
        exit;
    }
    
    $doctor = $result_validate->fetch_assoc();
    $id_doctor = $doctor['id_doctor'];
    $stmt_validate->close();

    // 1. Obtener Info General del Paciente
    $sql_info = "SELECT u.nombre_completo, p.fecha_nacimiento, p.genero, p.telefono_paciente, p.direccion, p.contacto_de_emergencia
                 FROM pacientes p
                 JOIN usuarios u ON p.id_usuario = u.id_usuario
                 WHERE p.id_paciente = ?";
    
    $stmt_info = $conn->prepare($sql_info);
    if (!$stmt_info) {
        throw new Exception("Error preparando consulta de info: " . $conn->error);
    }
    
    $stmt_info->bind_param("i", $id_paciente);
    $stmt_info->execute();
    $info = $stmt_info->get_result()->fetch_assoc();
    $stmt_info->close();

    if (!$info) {
        throw new Exception("Paciente no encontrado");
    }

    $respuesta['info'] = $info;

    // 2. Obtener Historial Médico
    $sql_historial = "SELECT tipo_registro, descripcion, creado_en 
                     FROM historial_medico 
                     WHERE id_paciente = ? 
                     ORDER BY creado_en DESC";
    $stmt_historial = $conn->prepare($sql_historial);
    if ($stmt_historial) {
        $stmt_historial->bind_param("i", $id_paciente);
        $stmt_historial->execute();
        $resultado_historial = $stmt_historial->get_result();
        $respuesta['historial'] = [];
        while ($fila = $resultado_historial->fetch_assoc()) {
            $respuesta['historial'][] = $fila;
        }
        $stmt_historial->close();
    }

    // 3. Obtener Recetas (últimos 6 meses)
    $sql_recetas = "SELECT la_receta, fecha_emision 
                   FROM receta_medica 
                   WHERE id_paciente = ? 
                   AND fecha_emision >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                   ORDER BY fecha_emision DESC";
    $stmt_recetas = $conn->prepare($sql_recetas);
    if ($stmt_recetas) {
        $stmt_recetas->bind_param("i", $id_paciente);
        $stmt_recetas->execute();
        $resultado_recetas = $stmt_recetas->get_result();
        $respuesta['recetas'] = [];
        while ($fila = $resultado_recetas->fetch_assoc()) {
            $respuesta['recetas'][] = $fila;
        }
        $stmt_recetas->close();
    }

    // 4. Obtener Próxima Cita
    $sql_cita = "SELECT fecha_programada, razon, type 
                FROM citas 
                WHERE id_paciente = ? 
                AND status = 'programado' 
                AND fecha_programada >= NOW()
                ORDER BY fecha_programada ASC 
                LIMIT 1";
    $stmt_cita = $conn->prepare($sql_cita);
    if ($stmt_cita) {
        $stmt_cita->bind_param("i", $id_paciente);
        $stmt_cita->execute();
        $cita = $stmt_cita->get_result()->fetch_assoc();
        $respuesta['proxima_cita'] = $cita ?: null;
        $stmt_cita->close();
    }

    echo json_encode($respuesta);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>