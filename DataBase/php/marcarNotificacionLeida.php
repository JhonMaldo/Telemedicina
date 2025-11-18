<?php
header('Content-Type: application/json');
include 'conexion.php';

// Obtenemos el ID que nos mandó el JavaScript
$data = json_decode(file_get_contents("php://input"), true);

// Debug: Ver qué datos estamos recibiendo
error_log("Datos recibidos: " . print_r($data, true));

if (empty($data['id_notificacion'])) {
    echo json_encode(["success" => false, "error" => "No se recibió ID"]);
    exit;
}

$idNotificacion = $data['id_notificacion'];

// Debug: Ver el ID que vamos a actualizar
error_log("ID Notificación a actualizar: " . $idNotificacion);

try {
    // Verificar si la notificación existe primero
    $sqlCheck = "SELECT id_notificaciones, leido FROM notificaciones WHERE id_notificaciones = ?";
    $stmtCheck = $conn->prepare($sqlCheck);
    $stmtCheck->bind_param('i', $idNotificacion);
    $stmtCheck->execute();
    $result = $stmtCheck->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "error" => "Notificación no encontrada"]);
        exit;
    }
    
    $notificacion = $result->fetch_assoc();
    $stmtCheck->close();
    
    // Si ya está leída, no hacemos nada
    if ($notificacion['leido'] == 1) {
        echo json_encode(["success" => true, "message" => "Notificación ya estaba leída"]);
        exit;
    }

    // Actualizar a leída
    $sql = "UPDATE notificaciones SET leido = 1 WHERE id_notificaciones = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $idNotificacion);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "Notificación marcada como leída."]);
    } else {
        echo json_encode(["success" => false, "error" => "No se pudo actualizar la notificación"]);
    }

    $stmt->close();

} catch (Exception $e) {
    error_log("Error en marcarNotificacionLeida: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>