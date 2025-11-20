<?php
header('Content-Type: application/json');
include 'conexion.php';

// ⚡ AGREGAR HEADERS DE CACHE
header("Cache-Control: no-cache, must-revalidate");
header("Expires: 0");

// ⚡ AGREGAR COMPRESIÓN GZIP (si el servidor lo soporta)
if (ob_get_level()) ob_end_clean();
ob_start('ob_gzhandler');

// ⬇️⬇️⬇️ CORREGIDO: Obtener ID del usuario desde el frontend ⬇️⬇️⬇️
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$idUsuario = $data['id_usuario'] ?? null;

if (!$idUsuario) {
    echo json_encode(["error" => "Se requiere el ID del usuario"]);
    exit;
}

try {
    $sql = "
        SELECT 
            id_notificaciones AS id,
            tipo_notificacion,
            mensaje,
            leido,
            DATE_FORMAT(creado_en, '%d/%m/%Y %H:%i') AS fecha
        FROM notificaciones
        WHERE id_usuario = ?
        ORDER BY creado_en DESC
        LIMIT 10
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $idUsuario);
    $stmt->execute();

    $resultado = $stmt->get_result();
    $notificaciones = $resultado->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode($notificaciones, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno del servidor"]);
}
?>