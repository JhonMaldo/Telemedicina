<?php
header('Content-Type: application/json');
include 'conexion.php';

$data = json_decode(file_get_contents("php://input"), true);

$id_paciente = intval($data['id_paciente'] ?? 0);
$id_usuario = intval($data['id_usuario'] ?? 0); // ⬅️ NUEVO: ID del doctor logueado
$telefono = $data['telefono_paciente'] ?? '';
$direccion = $data['direccion'] ?? '';
$contacto = $data['contacto_de_emergencia'] ?? '';
$historial_medico = $data['historial_medico'] ?? '';
$medicacion = $data['medicacion'] ?? '';
$alergias = $data['alergias'] ?? '';

if (!$id_paciente || !$id_usuario) {
    echo json_encode(["error" => "Datos inválidos: se requiere ID de paciente y usuario"]);
    exit;
}

try {
    // ⬇️⬇️⬇️ NUEVO: Validar que el doctor atiende a este paciente ⬇️⬇️⬇️
    $sql_validate = "SELECT d.id_doctor 
                     FROM doctores d 
                     INNER JOIN citas c ON d.id_doctor = c.id_doctor 
                     WHERE d.id_usuario = ? AND c.id_paciente = ? 
                     LIMIT 1";
    $stmt_validate = $conn->prepare($sql_validate);
    $stmt_validate->bind_param("ii", $id_usuario, $id_paciente);
    $stmt_validate->execute();
    $result_validate = $stmt_validate->get_result();
    
    if ($result_validate->num_rows === 0) {
        echo json_encode(["error" => "No tienes permisos para modificar este expediente"]);
        exit;
    }
    
    $doctor = $result_validate->fetch_assoc();
    $id_doctor = $doctor['id_doctor'];
    $stmt_validate->close();

    // Iniciar transacción
    $conn->begin_transaction();

    // 1. Actualizar datos básicos del paciente
    $sql = "UPDATE pacientes 
            SET telefono_paciente = ?, direccion = ?, contacto_de_emergencia = ?
            WHERE id_paciente = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssi", $telefono, $direccion, $contacto, $id_paciente);
    
    if (!$stmt->execute()) {
        throw new Exception("Error al actualizar datos básicos: " . $conn->error);
    }
    $stmt->close();

    // 2. Para historial médico - ELIMINAR antiguos y AGREGAR nuevo
    if (!empty($historial_medico) && $historial_medico !== 'Sin historial médico registrado.') {
        // Eliminar registros antiguos de tipo "Actualización"
        $delete_historial_sql = "DELETE FROM historial_medico 
                                WHERE id_paciente = ? AND tipo_registro = 'Actualización'";
        $delete_stmt = $conn->prepare($delete_historial_sql);
        $delete_stmt->bind_param("i", $id_paciente);
        
        if (!$delete_stmt->execute()) {
            throw new Exception("Error al eliminar historial antiguo: " . $conn->error);
        }
        $delete_stmt->close();

        // Insertar NUEVO registro (ahora con id_doctor)
        $insert_historial_sql = "INSERT INTO historial_medico (id_paciente, id_doctor, tipo_registro, descripcion, creado_en) 
                                VALUES (?, ?, 'Actualización', ?, NOW())";
        $insert_stmt = $conn->prepare($insert_historial_sql);
        $insert_stmt->bind_param("iis", $id_paciente, $id_doctor, $historial_medico);
        
        if (!$insert_stmt->execute()) {
            throw new Exception("Error al guardar historial médico: " . $conn->error);
        }
        $insert_stmt->close();
    }

    // 3. Para medicación - ELIMINAR antiguas y AGREGAR nueva
    if (!empty($medicacion) && $medicacion !== 'Sin medicación activa registrada.') {
        // Eliminar recetas antiguas
        $delete_medicacion_sql = "DELETE FROM receta_medica 
                                 WHERE id_paciente = ?";
        $delete_stmt = $conn->prepare($delete_medicacion_sql);
        $delete_stmt->bind_param("i", $id_paciente);
        
        if (!$delete_stmt->execute()) {
            throw new Exception("Error al eliminar recetas antiguas: " . $conn->error);
        }
        $delete_stmt->close();

        // Insertar NUEVA receta (ahora con id_doctor)
        $insert_medicacion_sql = "INSERT INTO receta_medica (id_paciente, id_doctor, la_receta, fecha_emision) 
                                 VALUES (?, ?, ?, NOW())";
        $insert_stmt = $conn->prepare($insert_medicacion_sql);
        $insert_stmt->bind_param("iis", $id_paciente, $id_doctor, $medicacion);
        
        if (!$insert_stmt->execute()) {
            throw new Exception("Error al guardar medicación: " . $conn->error);
        }
        $insert_stmt->close();
    }

    // 4. Para alergias - ELIMINAR antiguas y AGREGAR nueva
    if (!empty($alergias) && $alergias !== 'No se registran alergias conocidas') {
        // Eliminar alergias antiguas
        $delete_alergias_sql = "DELETE FROM historial_medico 
                               WHERE id_paciente = ? AND tipo_registro = 'Alergia'";
        $delete_stmt = $conn->prepare($delete_alergias_sql);
        $delete_stmt->bind_param("i", $id_paciente);
        
        if (!$delete_stmt->execute()) {
            throw new Exception("Error al eliminar alergias antiguas: " . $conn->error);
        }
        $delete_stmt->close();

        // Insertar NUEVA alergia (ahora con id_doctor)
        $insert_alergias_sql = "INSERT INTO historial_medico (id_paciente, id_doctor, tipo_registro, descripcion, creado_en) 
                               VALUES (?, ?, 'Alergia', ?, NOW())";
        $insert_stmt = $conn->prepare($insert_alergias_sql);
        $insert_stmt->bind_param("iis", $id_paciente, $id_doctor, $alergias);
        
        if (!$insert_stmt->execute()) {
            throw new Exception("Error al guardar alergias: " . $conn->error);
        }
        $insert_stmt->close();
    }

    // Confirmar transacción
    $conn->commit();
    echo json_encode(["mensaje" => "Expediente actualizado correctamente"]);
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    $conn->rollback();
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>