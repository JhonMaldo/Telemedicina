<?php
header('Content-Type: application/json');
include 'conexion.php';

$data = json_decode(file_get_contents("php://input"), true);

$id_paciente = intval($data['id_paciente'] ?? 0);
$telefono = $data['telefono_paciente'] ?? '';
$direccion = $data['direccion'] ?? '';
$contacto = $data['contacto_de_emergencia'] ?? '';

if (!$id_paciente) {
    echo json_encode(["error" => "ID de paciente inválido"]);
    exit;
}

$sql = "UPDATE pacientes 
        SET telefono_paciente = ?, direccion = ?, contacto_de_emergencia = ?
        WHERE id_paciente = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssi", $telefono, $direccion, $contacto, $id_paciente);

if ($stmt->execute()) {
    echo json_encode(["mensaje" => "Expediente actualizado correctamente"]);
} else {
    echo json_encode(["error" => "Error al actualizar expediente: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
