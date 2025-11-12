<?php
header('Content-Type: application/json');
include 'conexion.php';

header('Access-Control-Allow-Origin: *');

$id_receta = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id_receta == 0) {
    echo json_encode(['error' => 'ID de receta inválido']);
    exit;
}

try {
    $sql = "SELECT rm.id_receta_medica, rm.la_receta, rm.fecha_emision,
                   u.nombre_completo as paciente_nombre,
                   d.especialidad as doctor_especialidad,
                   du.nombre_completo as doctor_nombre,
                   d.numero_licencia as doctor_cedula
            FROM receta_medica rm
            JOIN pacientes p ON rm.id_paciente = p.id_paciente
            JOIN usuarios u ON p.id_usuario = u.id_usuario
            JOIN doctores d ON rm.id_doctor = d.id_doctor
            JOIN usuarios du ON d.id_usuario = du.id_usuario
            WHERE rm.id_receta_medica = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id_receta);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $receta = $result->fetch_assoc();
    
    if ($receta) {
        // Extraer información de la receta
        $lineas = explode("\n", $receta['la_receta']);
        $medicamentos = '';
        $instrucciones = '';
        $validez_dias = 30;
        
        $en_medicamentos = false;
        $en_instrucciones = false;
        
        foreach ($lineas as $linea) {
            if (strpos($linea, 'TRATAMIENTO PRESCRITO:') !== false) {
                $en_medicamentos = true;
                $en_instrucciones = false;
                continue;
            } elseif (strpos($linea, 'INSTRUCCIONES ESPECIALES:') !== false) {
                $en_medicamentos = false;
                $en_instrucciones = true;
                continue;
            } elseif (strpos($linea, 'VÁLIDA POR:') !== false) {
                preg_match('/(\d+)/', $linea, $matches);
                if ($matches) $validez_dias = $matches[1];
                break;
            }
            
            if ($en_medicamentos && trim($linea) !== '') {
                $medicamentos .= $linea . "\n";
            } elseif ($en_instrucciones && trim($linea) !== '') {
                $instrucciones .= $linea . "\n";
            }
        }
        
        $receta['medicamentos'] = trim($medicamentos);
        $receta['instrucciones'] = trim($instrucciones);
        $receta['validez_dias'] = $validez_dias;
    }
    
    echo json_encode($receta);
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>