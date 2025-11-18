<?php
header('Content-Type: application/json');
include 'conexion.php';

try {
    if (!isset($_GET['id_doctor'])) {
        echo json_encode(["error" => "No se envió id_doctor"]);
        exit;
    }

    $id_doctor = intval($_GET['id_doctor']);

    $sql = "SELECT 
                d.id_doctor, 
                u.nombre_completo,
                d.especialidad
            FROM doctores d
            INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
            WHERE d.id_doctor = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id_doctor);
    $stmt->execute();

    $result = $stmt->get_result();
    $doctor = $result->fetch_assoc();

    echo json_encode($doctor);

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
