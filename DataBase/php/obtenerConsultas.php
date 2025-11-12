<?php
header('Content-Type: application/json');
include 'conexion.php'; // tu archivo de conexión existente

try {
    $sql = "
        SELECT 
            c.id_citas AS id,
            c.id_paciente,
            p.nombre_completo AS paciente_nombre,
            c.fecha_programada,
            c.duracion_en_minutos AS duracion,
            c.type AS tipo,
            c.status AS estado,
            c.razon AS motivo,
            co.notas,
            co.url_video AS enlace_meet
        FROM citas c
        JOIN pacientes p ON c.id_paciente = p.id_paciente
        LEFT JOIN consultas co ON c.id_citas = co.id_citas
        ORDER BY c.fecha_programada ASC
    ";

    $stmt = $conexion->prepare($sql);
    $stmt->execute();

    $consultas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($consultas);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
