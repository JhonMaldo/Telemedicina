<?php
header('Content-Type: application/json');
include 'conexion.php'; // Esto te da la variable $conn

try {
    $sql = "
        SELECT 
            c.id_citas AS id,
            c.id_paciente,
            u.nombre_completo AS paciente_nombre,
            c.fecha_programada,
            c.duracion_en_minutos AS duracion,
            c.`type` AS tipo,
            c.`status` AS estado,
            c.razon AS motivo,
            co.notas,
            co.url_video AS enlace_meet
        FROM citas c
        INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        LEFT JOIN consultas co ON c.id_citas = co.id_citas
        ORDER BY c.fecha_programada DESC
    "; // ⬅️ Esta consulta no tiene parámetros, está bien

    $stmt = $conn->prepare($sql); // ⬅️ Cambio: $conn
    $stmt->execute();

    $resultado = $stmt->get_result(); // ⬅️ Nuevo
    $consultas = $resultado->fetch_all(MYSQLI_ASSOC); // ⬅️ Nuevo
    $stmt->close(); // ⬅️ Nuevo

    echo json_encode($consultas, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>