<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include 'conexion.php';

try {
    // ⬇️⬇️⬇️ MODIFICADO: Obtener ID del usuario desde el frontend ⬇️⬇️⬇️
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $id_usuario = $data['id_usuario'] ?? null;

    // Si no se envía por POST, intentar por GET
    if ($id_usuario === null) {
        $id_usuario = $_GET['id_usuario'] ?? null;
    }

    if (!$id_usuario) {
        echo json_encode(["error" => "Se requiere el ID del usuario"]);
        exit;
    }

    // ⬇️⬇️⬇️ NUEVO: Obtener id_doctor del usuario ⬇️⬇️⬇️
    $sql_doctor = "SELECT id_doctor FROM doctores WHERE id_usuario = ?";
    $stmt_doctor = $conn->prepare($sql_doctor);
    $stmt_doctor->bind_param("i", $id_usuario);
    $stmt_doctor->execute();
    $result_doctor = $stmt_doctor->get_result();
    
    if ($result_doctor->num_rows === 0) {
        echo json_encode(["error" => "Usuario no es un doctor válido"]);
        exit;
    }
    
    $doctor = $result_doctor->fetch_assoc();
    $id_doctor = $doctor['id_doctor'];
    $stmt_doctor->close();

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