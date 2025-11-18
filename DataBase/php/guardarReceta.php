<?php
header('Content-Type: application/json');
require_once "conexion.php"; // usa $conn

try {
    // Leer JSON recibido
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["error" => "No se recibieron datos"]);
        exit;
    }

    // Validar campos obligatorios
    $campos_obligatorios = ['id_doctor', 'id_paciente', 'id_consulta', 'la_receta', 'fecha_emision'];

    foreach ($campos_obligatorios as $campo) {
        if (!isset($data[$campo]) || $data[$campo] === "") {
            echo json_encode(["error" => "Falta el campo requerido: $campo"]);
            exit;
        }
    }

    // Extraer datos
    $id_doctor   = intval($data['id_doctor']);
    $id_paciente = intval($data['id_paciente']);
    $id_consulta = intval($data['id_consulta']);
    $la_receta   = $data['la_receta'];
    $url_pdf     = $data['url_pdf'] ?? "";
    $fecha       = $data['fecha_emision'];

    // PREPARAR INSERT (tabla real: receta_medica)
    $sql = "INSERT INTO receta_medica 
            (id_doctor, id_paciente, id_consulta, la_receta, url_pdf, fecha_emision)
            VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode(["error" => "Error en prepare(): " . $conn->error]);
        exit;
    }

    $stmt->bind_param(
        "iiisss",
        $id_doctor,
        $id_paciente,
        $id_consulta,
        $la_receta,
        $url_pdf,
        $fecha
    );

    if (!$stmt->execute()) {
        echo json_encode(["error" => "Error al ejecutar: " . $stmt->error]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Receta guardada correctamente",
        "id_receta_medica" => $stmt->insert_id
    ]);

} catch (Exception $e) {
    echo json_encode([
        "error" => "Excepción: " . $e->getMessage()
    ]);
}
