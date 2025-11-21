<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

include('conexion.php');

try {
    // Obtener notificaciones de pacientes
    $sql = "SELECT n.* 
            FROM notificaciones n 
            INNER JOIN usuarios u ON n.id_usuario = u.id_usuario 
            WHERE u.rol = 'paciente' 
            ORDER BY n.creado_en DESC 
            LIMIT 10";
    
    $result = $conn->query($sql);
    
    $notificaciones = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $notificaciones[] = $row;
        }
    }
    
    echo json_encode([
        'success' => true,
        'notificaciones' => $notificaciones,
        'total' => count($notificaciones)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener notificaciones: ' . $e->getMessage(),
        'notificaciones' => []
    ]);
}

$conn->close();
?>