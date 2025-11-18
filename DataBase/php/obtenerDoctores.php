<?php
// DataBase/php/obtenerDoctores.php

header('Content-Type: application/json');
// Headers para CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'conexion.php';

// Verificar conexión
if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión: ' . $conn->connect_error
    ]);
    exit;
}

try {
    // Obtener todos los doctores activos - USANDO LOS NOMBRES EXACTOS DE TU TABLA
    $sql = "SELECT id_usuario, nombre_completo, corre_electronico 
            FROM usuarios 
            WHERE role = 'Doctor' AND status = 'Active' 
            ORDER BY nombre_completo";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }
    
    $doctores = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $doctores[] = [
                'id' => $row['id_usuario'],
                'nombre' => $row['nombre_completo'],
                'email' => $row['corre_electronico']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'doctores' => $doctores,
        'total' => count($doctores)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener doctores: ' . $e->getMessage()
    ]);
}

$conn->close();
?>