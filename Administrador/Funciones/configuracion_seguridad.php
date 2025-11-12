<?php
session_start();
require_once 'conexion.php';

// Verificar si es administrador
if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] != 'administrador') {
    header("Location: login.php");
    exit();
}

// Actualizar políticas de seguridad
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action']) && $_POST['action'] == 'actualizar_seguridad') {
    $longitud_minima = intval($_POST['longitud_minima']);
    $requerir_mayusculas = isset($_POST['requerir_mayusculas']) ? 1 : 0;
    $requerir_numeros = isset($_POST['requerir_numeros']) ? 1 : 0;
    $dias_expiracion = intval($_POST['dias_expiracion']);
    $intentos_maximos = intval($_POST['intentos_maximos']);
    
    // Actualizar cada configuración
    $configuraciones = [
        'longitud_minima' => $longitud_minima,
        'requerir_mayusculas' => $requerir_mayusculas,
        'requerir_numeros' => $requerir_numeros,
        'dias_expiracion' => $dias_expiracion,
        'intentos_maximos' => $intentos_maximos
    ];
    
    $errores = [];
    foreach ($configuraciones as $clave => $valor) {
        $stmt = $conn->prepare("INSERT INTO configuracion_seguridad (clave, valor) VALUES (?, ?) 
                               ON DUPLICATE KEY UPDATE valor = ?, fecha_actualizacion = CURRENT_TIMESTAMP");
        $stmt->bind_param("sss", $clave, $valor, $valor);
        
        if (!$stmt->execute()) {
            $errores[] = "Error al actualizar $clave: " . $conn->error;
        }
    }
    
    if (empty($errores)) {
        $_SESSION['mensaje'] = "Configuración de seguridad actualizada exitosamente";
    } else {
        $_SESSION['error'] = implode("<br>", $errores);
    }
    
    header("Location: configuracion_seguridad.php");
    exit();
}

// Obtener configuración actual
$config = [];
$sql = "SELECT clave, valor FROM configuracion_seguridad";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $config[$row['clave']] = $row['valor'];
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Configuración de Seguridad</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    <div class="container mt-4">
        <h2 class="mb-4">Configuración de Seguridad</h2>
        
        <!-- Mensajes -->
        <?php if (isset($_SESSION['mensaje'])): ?>
            <div class="alert alert-success alert-dismissible fade show">
                <?= $_SESSION['mensaje']; ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
            <?php unset($_SESSION['mensaje']); ?>
        <?php endif; ?>
        
        <?php if (isset($_SESSION['error'])): ?>
            <div class="alert alert-danger alert-dismissible fade show">
                <?= $_SESSION['error']; ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
            <?php unset($_SESSION['error']); ?>
        <?php endif; ?>
        
        <!-- Políticas de Contraseñas -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Políticas de Contraseñas</h5>
            </div>
            <div class="card-body">
                <form method="POST">
                    <input type="hidden" name="action" value="actualizar_seguridad">
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Longitud mínima de contraseña:</label>
                            <input type="number" name="longitud_minima" class="form-control" 
                                   value="<?= $config['longitud_minima'] ?? 8 ?>" min="6" max="20" required>
                            <div class="form-text">Mínimo 6 caracteres, máximo 20</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Días para expiración de contraseña:</label>
                            <input type="number" name="dias_expiracion" class="form-control" 
                                   value="<?= $config['dias_expiracion'] ?? 90 ?>" min="30" max="365" required>
                            <div class="form-text">Número de días antes de que expire la contraseña</div>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Máximos intentos de login:</label>
                            <input type="number" name="intentos_maximos" class="form-control" 
                                   value="<?= $config['intentos_maximos'] ?? 3 ?>" min="1" max="10" required>
                            <div class="form-text">Intentos fallidos antes de bloquear la cuenta</div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="requerir_mayusculas" 
                                   <?= ($config['requerir_mayusculas'] ?? 0) ? 'checked' : '' ?>>
                            <label class="form-check-label">Requerir letras mayúsculas en contraseña</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="requerir_numeros" 
                                   <?= ($config['requerir_numeros'] ?? 0) ? 'checked' : '' ?>>
                            <label class="form-check-label">Requerir números en contraseña</label>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Guardar Configuración</button>
                </form>
            </div>
        </div>
        
        <!-- Gestión de Roles y Permisos -->
        <div class="card">
            <div class="card-header bg-secondary text-white">
                <h5 class="mb-0">Roles y Permisos del Sistema</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Rol</th>
                                <th>Permisos</th>
                                <th>Usuarios Activos</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            // Contar usuarios por rol
                            $sql_roles = "SELECT rol, COUNT(*) as total FROM usuarios WHERE activo = 1 GROUP BY rol";
                            $result_roles = $conn->query($sql_roles);
                            $contadores = [];
                            if ($result_roles->num_rows > 0) {
                                while ($row = $result_roles->fetch_assoc()) {
                                    $contadores[$row['rol']] = $row['total'];
                                }
                            }
                            ?>
                            <tr>
                                <td><strong>Administrador</strong></td>
                                <td>Acceso completo al sistema, gestión de usuarios, configuración de seguridad</td>
                                <td><span class="badge bg-primary"><?= $contadores['administrador'] ?? 0 ?></span></td>
                            </tr>
                            <tr>
                                <td><strong>Doctor</strong></td>
                                <td>Gestionar citas, ver pacientes, generar reportes médicos, ver historiales</td>
                                <td><span class="badge bg-info"><?= $contadores['doctor'] ?? 0 ?></span></td>
                            </tr>
                            <tr>
                                <td><strong>Paciente</strong></td>
                                <td>Agendar citas, ver historial médico, pagar facturas, ver recetas</td>
                                <td><span class="badge bg-success"><?= $contadores['paciente'] ?? 0 ?></span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</body>
</html>