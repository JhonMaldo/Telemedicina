<?php
header('Content-Type: application/json');
include 'conexion.php';

// ⚙️ Aquí pondrías el ID del doctor logueado
// (si usas sesiones puedes obtenerlo de $_SESSION['id_usuario'])
$idUsuario = 2; // Ejemplo: ID del doctor conectado

try {
    $sql = "
        SELECT 
            id_notificaciones AS id,
            tipo_notificacion,
            mensaje,
            leido,
            DATE_FORMAT(creado_en, '%d/%m/%Y %H:%i') AS fecha
        FROM notificaciones
        WHERE id_usuario = :idUsuario
        ORDER BY creado_en DESC
        LIMIT 10
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->execute([':idUsuario' => $idUsuario]);

    $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($notificaciones, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
