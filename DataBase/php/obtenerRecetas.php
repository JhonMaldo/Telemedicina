<?php
header('Content-Type: application/json');
include 'conexion.php';

header('Access-Control-Allow-Origin: *');

try {
    // ID del doctor hardcodeado
    $id_doctor = 101;
    
    // Verificar si se solicita un paciente específico
    $paciente_id = isset($_GET['paciente_id']) ? intval($_GET['paciente_id']) : null;
    
    if ($paciente_id) {
        // Obtener recetas solo del paciente específico
        $sql = "SELECT rm.id_receta_medica, rm.la_receta, rm.fecha_emision, 
                       u.nombre_completo as paciente_nombre
                FROM receta_medica rm
                JOIN pacientes p ON rm.id_paciente = p.id_paciente
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                WHERE rm.id_doctor = ? AND rm.id_paciente = ?
                ORDER BY rm.fecha_emision DESC
                LIMIT 20";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $id_doctor, $paciente_id);
    } else {
        // Obtener todas las recetas
        $sql = "SELECT rm.id_receta_medica, rm.la_receta, rm.fecha_emision, 
                       u.nombre_completo as paciente_nombre
                FROM receta_medica rm
                JOIN pacientes p ON rm.id_paciente = p.id_paciente
                JOIN usuarios u ON p.id_usuario = u.id_usuario
                WHERE rm.id_doctor = ?
                ORDER BY rm.fecha_emision DESC
                LIMIT 20";
        
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
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>