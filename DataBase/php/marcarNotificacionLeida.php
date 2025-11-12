<?php
header('Content-Type: application/json');
include 'conexion.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    echo json_encode(["error" => "Falta el ID de la notificación"]);
    exit;
}

try {
    $stmt = $conexion->prepare("UPDATE notificaciones SET leido = 1 WHERE id_notificaciones = :id");
    $stmt->execute([':id' => $data['id']]);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
