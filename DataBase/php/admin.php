<?php
header('Content-Type: application/json');
require_once 'db_connection.php';

class AdminBackend {
    private $conn;
    
    public function __construct() {
        $this->conn = getDatabaseConnection();
    }
    
    // RF-17: Gestión de usuarios
    public function obtenerUsuarios($filtros = []) {
        try {
            $sql = "SELECT u.*, 
                           d.especialidad, 
                           d.numero_licencia,
                           p.fecha_nacimiento,
                           p.genero
                    FROM usuarios u
                    LEFT JOIN doctores d ON u.id_usuario = d.id_usuario
                    LEFT JOIN pacientes p ON u.id_usuario = p.id_usuario
                    WHERE 1=1";
            $params = [];
            
            if (!empty($filtros['role'])) {
                $sql .= " AND u.role = ?";
                $params[] = $filtros['role'];
            }
            
            if (!empty($filtros['status'])) {
                $sql .= " AND u.status = ?";
                $params[] = $filtros['status'];
            }
            
            if (!empty($filtros['busqueda'])) {
                $sql .= " AND (u.nombre_completo LIKE ? OR u.corre_electronico LIKE ?)";
                $searchTerm = "%" . $filtros['busqueda'] . "%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            $sql .= " ORDER BY u.creado_en DESC";
            
            $stmt = $this->conn->prepare($sql);
            if (!empty($params)) {
                $stmt->execute($params);
            } else {
                $stmt->execute();
            }
            
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formatear datos para frontend
            foreach ($usuarios as &$usuario) {
                $usuario['tipo_usuario'] = $this->determinarTipoUsuario($usuario);
                $usuario['info_especifica'] = $this->obtenerInfoEspecifica($usuario);
            }
            
            return ['success' => true, 'data' => $usuarios];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al obtener usuarios: ' . $e->getMessage()];
        }
    }
    
    public function actualizarEstadoUsuario($idUsuario, $nuevoEstado) {
        try {
            $sql = "UPDATE usuarios SET status = ? WHERE id_usuario = ?";
            $stmt = $this->conn->prepare($sql);
            $resultado = $stmt->execute([$nuevoEstado, $idUsuario]);
            
            if ($resultado) {
                $this->registrarLog($_SESSION['user_id'], "Actualizar estado usuario", "usuarios", $idUsuario, "Estado cambiado a: $nuevoEstado");
                return ['success' => true, 'message' => 'Estado actualizado correctamente'];
            } else {
                return ['success' => false, 'error' => 'Error al actualizar estado'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error en la base de datos: ' . $e->getMessage()];
        }
    }
    
    public function crearUsuario($datosUsuario) {
        try {
            // Verificar si el email ya existe
            $sqlCheck = "SELECT id_usuario FROM usuarios WHERE corre_electronico = ?";
            $stmtCheck = $this->conn->prepare($sqlCheck);
            $stmtCheck->execute([$datosUsuario['email']]);
            
            if ($stmtCheck->fetch()) {
                return ['success' => false, 'error' => 'El email ya está registrado'];
            }
            
            // Hash de contraseña
            $passwordHash = password_hash($datosUsuario['password'], PASSWORD_DEFAULT);
            
            // Insertar usuario
            $sql = "INSERT INTO usuarios (nombre_completo, corre_electronico, contrasenia_hash, role, status) 
                    VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            $resultado = $stmt->execute([
                $datosUsuario['nombre'],
                $datosUsuario['email'],
                $passwordHash,
                $datosUsuario['role'],
                'Activo'
            ]);
            
            if ($resultado) {
                $idUsuario = $this->conn->lastInsertId();
                
                // Insertar en tabla específica según el rol
                if ($datosUsuario['role'] === 'Doctor') {
                    $this->crearDoctor($idUsuario, $datosUsuario);
                } elseif ($datosUsuario['role'] === 'Paciente') {
                    $this->crearPaciente($idUsuario, $datosUsuario);
                }
                
                $this->registrarLog($_SESSION['user_id'], "Crear usuario", "usuarios", $idUsuario, "Nuevo usuario: " . $datosUsuario['nombre']);
                return ['success' => true, 'message' => 'Usuario creado correctamente', 'id_usuario' => $idUsuario];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al crear usuario: ' . $e->getMessage()];
        }
    }
    
    private function crearDoctor($idUsuario, $datos) {
        $sql = "INSERT INTO doctores (id_doctor, id_usuario, numero_licencia, especialidad, telefono_doctor) 
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        
        // Generar ID de doctor
        $idDoctor = $this->generarIdDoctor();
        
        $stmt->execute([
            $idDoctor,
            $idUsuario,
            $datos['numero_licencia'],
            $datos['especialidad'],
            $datos['telefono']
        ]);
    }
    
    private function crearPaciente($idUsuario, $datos) {
        $sql = "INSERT INTO pacientes (id_paciente, id_usuario, fecha_nacimiento, genero, telefono_paciente) 
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        
        // Generar ID de paciente
        $idPaciente = $this->generarIdPaciente();
        
        $stmt->execute([
            $idPaciente,
            $idUsuario,
            $datos['fecha_nacimiento'],
            $datos['genero'],
            $datos['telefono']
        ]);
    }
    
    // RF-18: Gestión de facturación
    public function obtenerFacturas($filtros = []) {
        try {
            $sql = "SELECT p.*, u.nombre_completo as paciente_nombre, 
                           c.fecha_programada, c.type as tipo_consulta,
                           d.nombre_completo as doctor_nombre
                    FROM pagos p
                    LEFT JOIN citas c ON p.id_citas = c.id_citas
                    LEFT JOIN usuarios u ON c.id_paciente = u.id_usuario
                    LEFT JOIN doctores doc ON c.id_doctor = doc.id_doctor
                    LEFT JOIN usuarios d ON doc.id_usuario = d.id_usuario
                    WHERE 1=1";
            $params = [];
            
            if (!empty($filtros['status'])) {
                $sql .= " AND p.status = ?";
                $params[] = $filtros['status'];
            }
            
            if (!empty($filtros['fecha_desde'])) {
                $sql .= " AND DATE(p.creado_en) >= ?";
                $params[] = $filtros['fecha_desde'];
            }
            
            if (!empty($filtros['fecha_hasta'])) {
                $sql .= " AND DATE(p.creado_en) <= ?";
                $params[] = $filtros['fecha_hasta'];
            }
            
            $sql .= " ORDER BY p.creado_en DESC";
            
            $stmt = $this->conn->prepare($sql);
            if (!empty($params)) {
                $stmt->execute($params);
            } else {
                $stmt->execute();
            }
            
            $facturas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return ['success' => true, 'data' => $facturas];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al obtener facturas: ' . $e->getMessage()];
        }
    }
    
    public function actualizarEstadoPago($idPago, $nuevoEstado) {
        try {
            $sql = "UPDATE pagos SET status = ?, pagado_en = ? WHERE id_pagos = ?";
            
            $pagadoEn = ($nuevoEstado === 'pagado') ? date('Y-m-d H:i:s') : null;
            
            $stmt = $this->conn->prepare($sql);
            $resultado = $stmt->execute([$nuevoEstado, $pagadoEn, $idPago]);
            
            if ($resultado) {
                $this->registrarLog($_SESSION['user_id'], "Actualizar estado pago", "pagos", $idPago, "Estado cambiado a: $nuevoEstado");
                return ['success' => true, 'message' => 'Estado de pago actualizado correctamente'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al actualizar pago: ' . $e->getMessage()];
        }
    }
    
    // RF-18: Configuración del sistema
    public function obtenerConfiguracionSistema() {
        try {
            $sql = "SELECT * FROM configuracion_sistema";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            $configuracion = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convertir a formato clave-valor
            $configArray = [];
            foreach ($configuracion as $item) {
                $configArray[$item['clave']] = $item['valor'];
            }
            
            return ['success' => true, 'data' => $configArray];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al obtener configuración: ' . $e->getMessage()];
        }
    }
    
    public function actualizarConfiguracionSistema($configuraciones) {
        try {
            foreach ($configuraciones as $clave => $valor) {
                $sql = "INSERT INTO configuracion_sistema (clave, valor) 
                        VALUES (?, ?) 
                        ON DUPLICATE KEY UPDATE valor = ?, fecha_actualizacion = CURRENT_TIMESTAMP";
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([$clave, $valor, $valor]);
            }
            
            $this->registrarLog($_SESSION['user_id'], "Actualizar configuración", "configuracion_sistema", null, "Configuración actualizada");
            return ['success' => true, 'message' => 'Configuración actualizada correctamente'];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al actualizar configuración: ' . $e->getMessage()];
        }
    }
    
    public function obtenerPoliticasSeguridad() {
        try {
            $sql = "SELECT * FROM politicas_seguridad ORDER BY id_politica DESC LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            
            $politicas = $stmt->fetch(PDO::FETCH_ASSOC);
            return ['success' => true, 'data' => $politicas];
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al obtener políticas: ' . $e->getMessage()];
        }
    }
    
    public function actualizarPoliticasSeguridad($politicas) {
        try {
            $sql = "INSERT INTO politicas_seguridad 
                    (longitud_minima_password, requiere_mayusculas, requiere_numeros, 
                     requiere_caracteres_especiales, dias_validez_password, intentos_fallidos_permitidos, bloqueo_temporal_minutos) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            
            $resultado = $stmt->execute([
                $politicas['longitud_minima_password'],
                $politicas['requiere_mayusculas'] ? 1 : 0,
                $politicas['requiere_numeros'] ? 1 : 0,
                $politicas['requiere_caracteres_especiales'] ? 1 : 0,
                $politicas['dias_validez_password'],
                $politicas['intentos_fallidos_permitidos'],
                $politicas['bloqueo_temporal_minutos']
            ]);
            
            if ($resultado) {
                $this->registrarLog($_SESSION['user_id'], "Actualizar políticas seguridad", "politicas_seguridad", null, "Políticas de seguridad actualizadas");
                return ['success' => true, 'message' => 'Políticas de seguridad actualizadas correctamente'];
            }
            
        } catch (PDOException $e) {
            return ['success' => false, 'error' => 'Error al actualizar políticas: ' . $e->getMessage()];
        }
    }
    
    // Métodos auxiliares
    private function determinarTipoUsuario($usuario) {
        if (!empty($usuario['especialidad'])) return 'Doctor';
        if (!empty($usuario['fecha_nacimiento'])) return 'Paciente';
        return 'Administrador';
    }
    
    private function obtenerInfoEspecifica($usuario) {
        if (!empty($usuario['especialidad'])) {
            return "Especialidad: " . $usuario['especialidad'];
        } elseif (!empty($usuario['fecha_nacimiento'])) {
            return "Paciente - " . $usuario['genero'];
        } else {
            return "Administrador del sistema";
        }
    }
    
    private function generarIdDoctor() {
        $sql = "SELECT MAX(id_doctor) as max_id FROM doctores";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ($result['max_id'] + 1) ?? 104;
    }
    
    private function generarIdPaciente() {
        $sql = "SELECT MAX(id_paciente) as max_id FROM pacientes";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ($result['max_id'] + 1) ?? 207;
    }
    
    private function registrarLog($idAdmin, $accion, $tabla, $idRegistro, $detalles) {
        $sql = "INSERT INTO logs_administracion (id_usuario_admin, accion, tabla_afectada, id_registro_afectado, detalles, ip_address) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([
            $idAdmin,
            $accion,
            $tabla,
            $idRegistro,
            $detalles,
            $_SERVER['REMOTE_ADDR']
        ]);
    }
}

// Manejo de requests
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'Administrador') {
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit;
}

$admin = new AdminBackend();
$action = $_POST['action'] ?? '';

switch ($action) {
    case 'obtener_usuarios':
        $filtros = [
            'role' => $_POST['role'] ?? '',
            'status' => $_POST['status'] ?? '',
            'busqueda' => $_POST['busqueda'] ?? ''
        ];
        echo json_encode($admin->obtenerUsuarios($filtros));
        break;
        
    case 'actualizar_estado_usuario':
        echo json_encode($admin->actualizarEstadoUsuario($_POST['id_usuario'], $_POST['nuevo_estado']));
        break;
        
    case 'crear_usuario':
        echo json_encode($admin->crearUsuario($_POST));
        break;
        
    case 'obtener_facturas':
        $filtros = [
            'status' => $_POST['status'] ?? '',
            'fecha_desde' => $_POST['fecha_desde'] ?? '',
            'fecha_hasta' => $_POST['fecha_hasta'] ?? ''
        ];
        echo json_encode($admin->obtenerFacturas($filtros));
        break;
        
    case 'actualizar_estado_pago':
        echo json_encode($admin->actualizarEstadoPago($_POST['id_pago'], $_POST['nuevo_estado']));
        break;
        
    case 'obtener_configuracion':
        echo json_encode($admin->obtenerConfiguracionSistema());
        break;
        
    case 'actualizar_configuracion':
        echo json_encode($admin->actualizarConfiguracionSistema($_POST['configuraciones']));
        break;
        
    case 'obtener_politicas':
        echo json_encode($admin->obtenerPoliticasSeguridad());
        break;
        
    case 'actualizar_politicas':
        echo json_encode($admin->actualizarPoliticasSeguridad($_POST['politicas']));
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
}
?>