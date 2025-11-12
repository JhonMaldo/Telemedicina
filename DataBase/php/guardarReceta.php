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

// Log para debugging
error_log("Datos recibidos: " . print_r($input, true));

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos o vacíos']);
    exit;
}

// Validar campos requeridos
if (!isset($input['paciente_id']) || !isset($input['medicamentos'])) {
    echo json_encode(['success' => false, 'error' => 'Faltan campos requeridos: paciente_id o medicamentos']);
    exit;
}

try {
    // ID del doctor hardcodeado (en un sistema real esto vendría de la sesión)
    $id_doctor = 101;
    $id_paciente = intval($input['paciente_id']);
    $medicamentos = $input['medicamentos'];
    $instrucciones = isset($input['instrucciones']) ? $input['instrucciones'] : '';
    $validez_dias = isset($input['validez_dias']) ? intval($input['validez_dias']) : 30;
    
    // Preparar la receta para guardar
    $receta_texto = "TRATAMIENTO PRESCRITO:\n" . $medicamentos;
    if (!empty($instrucciones)) {
        $receta_texto .= "\n\nINSTRUCCIONES ESPECIALES:\n" . $instrucciones;
    }
    $receta_texto .= "\n\nVÁLIDA POR: " . $validez_dias . " días";
    
    // Insertar en la base de datos
    $sql = "INSERT INTO receta_medica (id_doctor, id_paciente, la_receta, fecha_emision) 
            VALUES (?, ?, ?, NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iis", $id_doctor, $id_paciente, $receta_texto);
    
    if ($stmt->execute()) {
        $nuevo_id = $stmt->insert_id;
        error_log("Receta guardada exitosamente. ID: " . $nuevo_id);
        echo json_encode([
            'success' => true, 
            'id_receta' => $nuevo_id,
            'message' => 'Receta guardada correctamente'
        ]);
    } else {
        throw new Exception("Error al guardar receta: " . $stmt->error);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("Error en guardarReceta.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>