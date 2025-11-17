<?php

// DEBUG - Ver qué está pasando
error_log("=== ADMIN.PH ACCEDIDO ===");
error_log("ACTION: " . ($_GET['action'] ?? 'Ninguno'));
error_log("METHOD: " . $_SERVER['REQUEST_METHOD']);

// admin.php - VERSIÓN CORREGIDA PARA DEVOLVER HTML
header('Content-Type: text/html; charset=utf-8');

// admin.php - VERSIÓN CORREGIDA PARA DEVOLVER HTML
header('Content-Type: text/html; charset=utf-8');

// Incluir conexión a la base de datos
require_once 'conexion.php';

// Manejo de requests
$requestMethod = $_SERVER['REQUEST_METHOD'];
$action = '';

if ($requestMethod === 'POST') {
    $action = $_POST['action'] ?? '';
} else {
    $action = $_GET['action'] ?? '';
}

switch ($action) {
    case 'obtener_usuarios':
        obtenerUsuarios($conn);
        break;
        
    case 'obtener_estadisticas':
        obtenerEstadisticas($conn);
        break;
        
    case 'crear_usuario':
        crearUsuario($conn);
        break;
        
    case 'actualizar_estado_usuario':
        actualizarEstadoUsuario($conn);
        break;
        
    case 'obtener_facturas':
        obtenerFacturas($conn);
        break;
        
    case 'actualizar_estado_pago':
        actualizarEstadoPago($conn);
        break;
        
    default:
        echo 'Acción no válida: ' . $action;
}

// RF-17: Gestión de usuarios - DEVUELVE HTML
function obtenerUsuarios($conn) {
    $filtro_rol = $_GET['role'] ?? $_POST['role'] ?? '';
    $filtro_status = $_GET['status'] ?? $_POST['status'] ?? '';
    $busqueda = $_GET['busqueda'] ?? $_POST['busqueda'] ?? '';

    $sql = "SELECT 
                u.id_usuario,
                u.nombre_completo,
                u.corre_electronico,
                u.role,
                u.creado_en,
                u.status,
                d.especialidad,
                d.numero_licencia,
                p.fecha_nacimiento,
                p.genero
            FROM usuarios u
            LEFT JOIN doctores d ON u.id_usuario = d.id_usuario
            LEFT JOIN pacientes p ON u.id_usuario = p.id_usuario
            WHERE 1=1";
    
    $params = [];
    $types = "";

    if (!empty($filtro_rol)) {
        $sql .= " AND u.role = ?";
        $params[] = $filtro_rol;
        $types .= "s";
    }
    
    if (!empty($filtro_status)) {
        $sql .= " AND u.status = ?";
        $params[] = $filtro_status;
        $types .= "s";
    }
    
    if (!empty($busqueda)) {
        $sql .= " AND (u.nombre_completo LIKE ? OR u.corre_electronico LIKE ?)";
        $searchTerm = "%" . $busqueda . "%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "ss";
    }

    $sql .= " ORDER BY u.creado_en DESC";

    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        echo '<tr><td colspan="8">Error preparando la consulta: ' . $conn->error . '</td></tr>';
        return;
    }
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $resultado = $stmt->get_result();

    $html = '';
    while ($fila = $resultado->fetch_assoc()) {
        $statusClass = $fila['status'] === 'Activo' ? 'status-active' : 'status-inactive';
        $btnClass = $fila['status'] === 'Activo' ? 'btn-danger' : 'btn-success';
        $btnIcon = $fila['status'] === 'Activo' ? 'fa-ban' : 'fa-check';
        $nuevoEstado = $fila['status'] === 'Activo' ? 'Inactivo' : 'Activo';
        
        $html .= "
        <tr>
            <td>USR-" . str_pad($fila['id_usuario'], 3, '0', STR_PAD_LEFT) . "</td>
            <td>" . htmlspecialchars($fila['nombre_completo']) . "</td>
            <td>" . htmlspecialchars($fila['corre_electronico']) . "</td>
            <td>" . htmlspecialchars($fila['role']) . "</td>
            <td>" . date('d M, Y', strtotime($fila['creado_en'])) . "</td>
            <td>Nunca</td>
            <td><span class=\"status-badge $statusClass\">" . htmlspecialchars($fila['status']) . "</span></td>
            <td>
                <div class=\"action-buttons\">
                    <button class=\"btn btn-sm btn-warning\" onclick=\"editarUsuario(" . $fila['id_usuario'] . ")\">
                        <i class=\"fas fa-edit\"></i>
                    </button>
                    <button class=\"btn btn-sm $btnClass\" 
                            onclick=\"cambiarEstadoUsuario(" . $fila['id_usuario'] . ", '$nuevoEstado')\">
                        <i class=\"fas $btnIcon\"></i>
                    </button>
                </div>
            </td>
        </tr>";
    }
    
    if (empty($html)) {
        $html = '<tr><td colspan="8">No se encontraron usuarios</td></tr>';
    }
    
    echo $html;
    $stmt->close();
}

// RF-18: Estadísticas del dashboard - DEVUELVE HTML
function obtenerEstadisticas($conn) {
    $stats = [];

    // Doctores activos
    $sql_doctores = "SELECT COUNT(*) as total 
                     FROM doctores d 
                     JOIN usuarios u ON d.id_usuario = u.id_usuario 
                     WHERE u.status = 'Activo'";
    $stmt = $conn->prepare($sql_doctores);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stats['doctores'] = $fila['total'] ?? 0;
    $stmt->close();

    // Pacientes activos
    $sql_pacientes = "SELECT COUNT(*) as total 
                      FROM pacientes p 
                      JOIN usuarios u ON p.id_usuario = u.id_usuario 
                      WHERE u.status = 'Activo'";
    $stmt = $conn->prepare($sql_pacientes);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stats['pacientes'] = $fila['total'] ?? 0;
    $stmt->close();

    // Citas del día
    $sql_citas = "SELECT COUNT(*) as total 
                  FROM citas 
                  WHERE DATE(fecha_programada) = CURDATE() 
                  AND status = 'programado'";
    $stmt = $conn->prepare($sql_citas);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stats['citas'] = $fila['total'] ?? 0;
    $stmt->close();

    // Recetas del mes
    $sql_recetas = "SELECT COUNT(*) as total 
                    FROM receta_medica 
                    WHERE MONTH(fecha_emision) = MONTH(CURDATE()) 
                    AND YEAR(fecha_emision) = YEAR(CURDATE())";
    $stmt = $conn->prepare($sql_recetas);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stats['recetas'] = $fila['total'] ?? 0;
    $stmt->close();

    // Generar HTML para las tarjetas
    $html = "
    <div class=\"card\">
        <i class=\"fas fa-user-md\"></i>
        <h3>Doctores Registrados</h3>
        <p>" . $stats['doctores'] . " doctores activos</p>
    </div>
    <div class=\"card\">
        <i class=\"fas fa-user-injured\"></i>
        <h3>Pacientes Registrados</h3>
        <p>" . $stats['pacientes'] . " pacientes activos</p>
    </div>
    <div class=\"card\">
        <i class=\"fas fa-calendar-check\"></i>
        <h3>Citas del Día</h3>
        <p>" . $stats['citas'] . " citas programadas</p>
    </div>
    <div class=\"card\">
        <i class=\"fas fa-file-prescription\"></i>
        <h3>Recetas Emitidas</h3>
        <p>" . $stats['recetas'] . " recetas este mes</p>
    </div>";
    
    echo $html;
}

// Crear nuevo usuario - DEVUELVE TEXTO
function crearUsuario($conn) {
    $nombre = $_GET['nombre'] ?? $_POST['nombre'] ?? '';
    $email = $_GET['email'] ?? $_POST['email'] ?? '';
    $role = $_GET['role'] ?? $_POST['role'] ?? '';
    $password = $_GET['password'] ?? $_POST['password'] ?? '';

    if (empty($nombre) || empty($email) || empty($role) || empty($password)) {
        echo 'Todos los campos son requeridos';
        return;
    }

    // Verificar si el email ya existe
    $sql_check = "SELECT id_usuario FROM usuarios WHERE corre_electronico = ?";
    $stmt = $conn->prepare($sql_check);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    if ($resultado->num_rows > 0) {
        echo 'El email ya está registrado';
        $stmt->close();
        return;
    }
    $stmt->close();

    // Hash de contraseña
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Insertar usuario
    $sql_insert = "INSERT INTO usuarios (nombre_completo, corre_electronico, contrasenia_hash, role, status) 
                   VALUES (?, ?, ?, ?, 'Activo')";
    $stmt = $conn->prepare($sql_insert);
    $stmt->bind_param("ssss", $nombre, $email, $password_hash, $role);
    
    if ($stmt->execute()) {
        $id_usuario = $stmt->insert_id;
        
        // Si es doctor, crear registro en tabla doctores
        if ($role === 'Doctor') {
            $id_doctor = generarIdDoctor($conn);
            $sql_doctor = "INSERT INTO doctores (id_doctor, id_usuario, numero_licencia, especialidad) 
                           VALUES (?, ?, ?, ?)";
            $stmt_doctor = $conn->prepare($sql_doctor);
            $licencia = "LIC-" . strtoupper(uniqid());
            $especialidad = "Medicina General";
            $stmt_doctor->bind_param("iiss", $id_doctor, $id_usuario, $licencia, $especialidad);
            $stmt_doctor->execute();
            $stmt_doctor->close();
        }
        // Si es paciente, crear registro en tabla pacientes
        elseif ($role === 'Paciente') {
            $id_paciente = generarIdPaciente($conn);
            $sql_paciente = "INSERT INTO pacientes (id_paciente, id_usuario) 
                             VALUES (?, ?)";
            $stmt_paciente = $conn->prepare($sql_paciente);
            $stmt_paciente->bind_param("ii", $id_paciente, $id_usuario);
            $stmt_paciente->execute();
            $stmt_paciente->close();
        }
        
        echo 'Usuario creado correctamente';
    } else {
        echo 'Error al crear usuario: ' . $stmt->error;
    }
    
    $stmt->close();
}

// Actualizar estado de usuario - DEVUELVE TEXTO
function actualizarEstadoUsuario($conn) {
    $id_usuario = $_GET['id_usuario'] ?? $_POST['id_usuario'] ?? 0;
    $nuevo_estado = $_GET['nuevo_estado'] ?? $_POST['nuevo_estado'] ?? '';

    if (empty($id_usuario) || empty($nuevo_estado)) {
        echo 'Datos incompletos';
        return;
    }

    $sql = "UPDATE usuarios SET status = ? WHERE id_usuario = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $nuevo_estado, $id_usuario);
    
    if ($stmt->execute()) {
        echo 'Estado actualizado correctamente';
    } else {
        echo 'Error al actualizar estado: ' . $stmt->error;
    }
    
    $stmt->close();
}

// Funciones auxiliares
function generarIdDoctor($conn) {
    $sql = "SELECT MAX(id_doctor) as max_id FROM doctores";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stmt->close();
    
    return isset($fila['max_id']) ? $fila['max_id'] + 1 : 104;
}

function generarIdPaciente($conn) {
    $sql = "SELECT MAX(id_paciente) as max_id FROM pacientes";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $resultado = $stmt->get_result();
    $fila = $resultado->fetch_assoc();
    $stmt->close();
    
    return isset($fila['max_id']) ? $fila['max_id'] + 1 : 207;
}

?>