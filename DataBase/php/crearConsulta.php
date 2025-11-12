<?php
header('Content-Type: application/json');
include 'conexion.php';

$data = json_decode(file_get_contents("php://input"), true);

try {
    if (!$data) {
        throw new Exception("No se recibieron datos.");
    }

    // Validar datos mínimos
    if (empty($data['paciente_id']) || empty($data['fecha_programada']) || empty($data['duracion'])) {
        throw new Exception("Faltan datos obligatorios.");
    }

    // 🔹 ID del doctor — puedes reemplazarlo por el ID del doctor logueado en sesión
    $idDoctor = 101;

    // 1️⃣ Insertar en tabla CITAS
    $sqlCita = "
        INSERT INTO citas (
            id_paciente,
            id_doctor,
            fecha_programada,
            duracion_en_minutos,
            type,
            status,
            razon
        ) VALUES (
            :id_paciente,
            :id_doctor,
            :fecha_programada,
            :duracion,
            'virtual',
            'programado',
            :motivo
        )
    ";

    $stmt = $conexion->prepare($sqlCita);
    $stmt->execute([
        ':id_paciente' => $data['paciente_id'],
        ':id_doctor' => $idDoctor,
        ':fecha_programada' => $data['fecha_programada'],
        ':duracion' => $data['duracion'],
        ':motivo' => $data['motivo']
    ]);

    $idCita = $conexion->lastInsertId();

    // 2️⃣ Insertar en tabla CONSULTAS
    $sqlConsulta = "
        INSERT INTO consultas (id_citas, url_video, notas)
        VALUES (:id_citas, :url_video, :notas)
    ";

    $stmt2 = $conexion->prepare($sqlConsulta);
    $stmt2->execute([
        ':id_citas' => $idCita,
        ':url_video' => $data['url_video'],
        ':notas' => $data['notas'] ?? null
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Consulta creada correctamente.",
        "id_cita" => $idCita
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
