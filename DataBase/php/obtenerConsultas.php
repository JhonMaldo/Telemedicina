<?php
header('Content-Type: application/json');
include 'conexion.php';

// ========== NUEVO: Obtener el ID del USUARIO desde el frontend ==========
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$id_usuario = $data['id_usuario'] ?? null;

// Si no se envía por POST, intentar por GET
if ($id_usuario === null) {
    $id_usuario = $_GET['id_usuario'] ?? null;
}

// Validar que tenemos un ID de usuario
if ($id_usuario === null) {
    echo json_encode(["error" => "Se requiere el ID del usuario"]);
    exit;
}

try {
    // ⬇️⬇️⬇️ NUEVO: Primero obtener el id_doctor del usuario ⬇️⬇️⬇️
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

    // ⬇️⬇️⬇️ CONSULTA PRINCIPAL CON EL ID_DOCTOR CORRECTO ⬇️⬇️⬇️
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
        WHERE c.id_doctor = ?  -- ⬅️ Filtrar por el id_doctor correcto
        ORDER BY c.fecha_programada DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id_doctor); // ⬅️ Usar el id_doctor obtenido
    $stmt->execute();

    $resultado = $stmt->get_result();
    $consultas = $resultado->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode($consultas, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>