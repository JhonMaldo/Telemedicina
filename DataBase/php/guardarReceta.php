<?php
header('Content-Type: application/json');
include 'conexion.php';

// Habilitar CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Obtener datos del POST
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit;
}

try {
    // ID del doctor hardcodeado (en un sistema real esto vendría de la sesión)
    $id_doctor = 101;
    
    // Preparar la receta para guardar
    $receta_texto = "TRATAMIENTO PRESCRITO:\n" . $input['medicamentos'];
    if (!empty($input['instrucciones'])) {
        $receta_texto .= "\n\nINSTRUCCIONES ESPECIALES:\n" . $input['instrucciones'];
    }
    $receta_texto .= "\n\nVÁLIDA POR: " . $input['validez_dias'] . " días";
    
    // Insertar en la base de datos
    $sql = "INSERT INTO receta_medica (id_doctor, id_paciente, la_receta, fecha_emision) 
            VALUES (?, ?, ?, NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iis", $id_doctor, $input['paciente_id'], $receta_texto);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id_receta' => $stmt->insert_id]);
    } else {
        throw new Exception("Error al guardar receta: " . $stmt->error);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>