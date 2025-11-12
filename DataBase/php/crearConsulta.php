<?php
header('Content-Type: application/json');
include 'conexion.php';

$data = json_decode(file_get_contents("php://input"), true);

try {
    // Insertar en la tabla citas
    $stmt = $conexion->prepare("
        INSERT INTO citas (id_paciente, id_doctor, fecha_programada, duracion_en_minutos, type, status, razon)
        VALUES (:id_paciente, :id_doctor, :fecha_programada, :duracion_en_minutos, 'virtual', 'programado', :razon)
    ");
    
    $stmt->execute([
        ':id_paciente' => $data['paciente_id'],
        ':id_doctor' => 101, // puedes reemplazar por el ID del doctor logueado
        ':fecha_programada' => $data['fecha_programada'],
        ':duracion_en_minutos' => $data['duracion'],
        ':razon' => $data['motivo']
    ]);

    $idCita = $conexion->lastInsertId();

    // Insertar también en la tabla consultas
    $stmt2 = $conexion->prepare("
        INSERT INTO consultas (id_citas, url_video, notas)
        VALUES (:id_citas, :url_video, :notas)
    ");
    $stmt2->execute([
        ':id_citas' => $idCita,
        ':url_video' => $data['url_video'],
        ':notas' => $data['notas']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Consulta creada correctamente',
        'id_cita' => $idCita
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
