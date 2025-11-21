<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include 'conexion.php';

try {
    // ID del doctor fijo
    $id_doctor = 101;

    // Filtrar por paciente si viene en GET
    $paciente_id = isset($_GET['paciente_id']) ? intval($_GET['paciente_id']) : null;

    if ($paciente_id) {
        // Consulta cuando se filtra por paciente
        $sql = "SELECT 
                    r.id_receta_medica,
                    r.id_consulta,
                    r.id_doctor,
                    r.id_paciente,
                    r.la_receta,
                    r.fecha_emision,
                    u.nombre_completo AS paciente_nombre
                FROM receta_medica r
                INNER JOIN pacientes p ON r.id_paciente = p.id_paciente
                INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
                WHERE r.id_doctor = ? AND r.id_paciente = ?
                ORDER BY r.fecha_emision DESC
                LIMIT 50";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $id_doctor, $paciente_id);

    } else {
        // Consulta para TODAS las recetas del doctor
        $sql = "SELECT 
                    r.id_receta_medica,
                    r.id_consulta,
                    r.id_doctor,
                    r.id_paciente,
                    r.la_receta,
                    r.fecha_emision,
                    u.nombre_completo AS paciente_nombre
                FROM receta_medica r
                INNER JOIN pacientes p ON r.id_paciente = p.id_paciente
                INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
                WHERE r.id_doctor = ?
                ORDER BY r.fecha_emision DESC
                LIMIT 50";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id_doctor);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $recetas = [];
    while ($row = $result->fetch_assoc()) {
        $recetas[] = $row;
    }

    echo json_encode($recetas);

    $stmt->close();

} catch (Exception $e) {
    echo json_encode(["error" => "Error: " . $e->getMessage()]);
}

$conn->close();
?>
