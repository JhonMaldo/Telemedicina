<?php
// DataBase/php/agendarCita.php

header('Content-Type: application/json');
require_once 'conexion.php';

// Verificar que la solicitud es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Obtener y validar datos del formulario
$datos = json_decode(file_get_contents('php://input'), true);

if (!$datos) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit;
}

// Extraer y sanitizar datos
$tipo_consulta = isset($datos['tipo_consulta']) ? trim($datos['tipo_consulta']) : '';
$especialidad = isset($datos['especialidad']) ? trim($datos['especialidad']) : NULL;
$doctor_id = isset($datos['doctor_id']) ? intval($datos['doctor_id']) : NULL;
$fecha = isset($datos['fecha']) ? trim($datos['fecha']) : '';
$hora = isset($datos['hora']) ? trim($datos['hora']) : '';
$sintomas = isset($datos['sintomas']) ? trim($datos['sintomas']) : '';

// OBTENER ID DEL PACIENTE DESDE LA SESIÓN (por ahora usaremos un ID temporal)
// En producción, esto vendría de la sesión del usuario logueado
session_start();
$paciente_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 101; // Temporal: usuario "Juan Pérez"

// Validaciones básicas
if (empty($tipo_consulta) || empty($fecha) || empty($hora)) {
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios: tipo de consulta, fecha y hora']);
    exit;
}

// Validar fecha (no permitir fechas pasadas)
$fecha_actual = date('Y-m-d');
if ($fecha < $fecha_actual) {
    echo json_encode(['success' => false, 'message' => 'No se pueden agendar citas en fechas pasadas']);
    exit;
}

// Combinar fecha y hora para el formato de la base de datos
$fecha_programada = $fecha . ' ' . $hora . ':00';

// Determinar tipo de consulta (virtual/en_persona) basado en el tipo
$tipo_modalidad = 'virtual'; // Por defecto virtual
if ($tipo_consulta === 'emergency') {
    $tipo_modalidad = 'en_persona';
}

// Calcular duración basada en el tipo de consulta
$duracion_en_minutos = 30; // minutos por defecto
if ($tipo_consulta === 'specialist') {
    $duracion_en_minutos = 45;
} elseif ($tipo_consulta === 'follow-up') {
    $duracion_en_minutos = 30;
} elseif ($tipo_consulta === 'emergency') {
    $duracion_en_minutos = 60;
}

// Verificar disponibilidad del médico (si se seleccionó médico específico)
if ($doctor_id) {
    $sql_verificar = "SELECT id_class FROM citas WHERE id_doctor = ? AND fecha_programada = ? AND status != 'cancelada'";
    $stmt_verificar = $conn->prepare($sql_verificar);
    $stmt_verificar->bind_param("is", $doctor_id, $fecha_programada);
    $stmt_verificar->execute();
    $stmt_verificar->store_result();
    
    if ($stmt_verificar->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El médico no está disponible en ese horario']);
        $stmt_verificar->close();
        exit;
    }
    $stmt_verificar->close();
}

// Insertar la cita en la base de datos
try {
    $sql = "INSERT INTO citas (id_doctor, id_paciente, fecha_programada, duracion_en_minutos, type, status, razon, creado_en) 
            VALUES (?, ?, ?, ?, ?, 'programado', ?, NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iisiss", $doctor_id, $paciente_id, $fecha_programada, $duracion_en_minutos, $tipo_modalidad, $sintomas);
    
    if ($stmt->execute()) {
        $cita_id = $stmt->insert_id;
        
        // Respuesta de éxito
        echo json_encode([
            'success' => true, 
            'message' => 'Cita agendada exitosamente',
            'cita_id' => $cita_id,
            'datos' => [
                'fecha' => $fecha,
                'hora' => $hora,
                'tipo' => $tipo_modalidad,
                'duracion' => $duracion_en_minutos
            ]
        ]);
    } else {
        throw new Exception('Error al insertar en la base de datos: ' . $stmt->error);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}

$conn->close();
?>