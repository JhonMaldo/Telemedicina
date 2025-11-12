<?php
session_start();
require_once '../../DataBase/php/conexion.php';

// Verificar si es administrador
if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] != 'administrador') {
    header("Location: login.php");
    exit();
}

// Listar usuarios (AJAX)
if (isset($_GET['action']) && $_GET['action'] == 'listar') {
    $result = $conn->query("SELECT id, nombre, email, rol FROM usuarios ORDER BY id DESC");
    $usuarios = [];
    while ($row = $result->fetch_assoc()) $usuarios[] = $row;
    header('Content-Type: application/json');
    echo json_encode($usuarios);
    exit;
}

// Agregar o actualizar usuario
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $nombre = $_POST['nombre'];
    $email = $_POST['email'];
    $rol = $_POST['rol'];
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    if ($id > 0) {
        // Actualizar
        if ($password) {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE usuarios SET nombre=?, email=?, rol=?, password=? WHERE id=?");
            $stmt->bind_param("ssssi", $nombre, $email, $rol, $hash, $id);
        } else {
            $stmt = $conn->prepare("UPDATE usuarios SET nombre=?, email=?, rol=? WHERE id=?");
            $stmt->bind_param("sssi", $nombre, $email, $rol, $id);
        }
        $stmt->execute();
    } else {
        // Agregar
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, rol, password) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $nombre, $email, $rol, $hash);
        $stmt->execute();
    }
    exit;
}

// Eliminar usuario
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action']) && $_POST['action'] == 'eliminar') {
    $id = intval($_POST['id']);
    $conn->query("DELETE FROM usuarios WHERE id = $id");
    exit;
}

// Procesar acciones POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'crear_usuario':
                $nombre = trim($_POST['nombre']);
                $email = trim($_POST['email']);
                $password = $_POST['password'];
                $rol = $_POST['rol'];
                $activo = 1;
                
                // Verificar si el email ya existe
                $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    $_SESSION['error'] = "El email ya está registrado";
                    header("Location: usuarios.php");
                    exit();
                }
                
                // Crear usuario
                $password_hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssi", $nombre, $email, $password_hash, $rol, $activo);
                
                if ($stmt->execute()) {
                    $_SESSION['mensaje'] = "Usuario creado exitosamente";
                } else {
                    $_SESSION['error'] = "Error al crear el usuario: " . $conn->error;
                }
                header("Location: usuarios.php");
                exit();
                break;
                
            case 'modificar_usuario':
                $usuario_id = $_POST['usuario_id'];
                $nombre = trim($_POST['nombre']);
                $email = trim($_POST['email']);
                $rol = $_POST['rol'];
                
                // Verificar si el email ya existe en otro usuario
                $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
                $stmt->bind_param("si", $email, $usuario_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows > 0) {
                    $_SESSION['error'] = "El email ya está registrado en otro usuario";
                    header("Location: usuarios.php");
                    exit();
                }
                
                $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?");
                $stmt->bind_param("sssi", $nombre, $email, $rol, $usuario_id);
                
                if ($stmt->execute()) {
                    $_SESSION['mensaje'] = "Usuario modificado exitosamente";
                } else {
                    $_SESSION['error'] = "Error al modificar el usuario: " . $conn->error;
                }
                header("Location: usuarios.php");
                exit();
                break;
        }
    }
}

// Procesar acciones GET
if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'toggle_usuario':
            $usuario_id = $_GET['id'];
            
            $stmt = $conn->prepare("SELECT activo FROM usuarios WHERE id = ?");
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $usuario = $result->fetch_assoc();
            
            if ($usuario) {
                $nuevo_estado = $usuario['activo'] ? 0 : 1;
                $stmt = $conn->prepare("UPDATE usuarios SET activo = ? WHERE id = ?");
                $stmt->bind_param("ii", $nuevo_estado, $usuario_id);
                
                if ($stmt->execute()) {
                    $_SESSION['mensaje'] = $nuevo_estado ? "Usuario activado" : "Usuario desactivado";
                } else {
                    $_SESSION['error'] = "Error al cambiar el estado del usuario: " . $conn->error;
                }
            }
            header("Location: usuarios.php");
            exit();
            break;
    }
}

// Obtener lista de usuarios
$sql = "SELECT * FROM usuarios ORDER BY id DESC";
$result = $conn->query($sql);
$usuarios = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Gestión de Usuarios</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <style>
        .badge { font-size: 0.9em; }
        .table-responsive { max-height: 500px; }
    </style>
</head>
<body>
    <div class="container mt-4">
        <h2 class="mb-4">Gestión de Usuarios</h2>
        
        <!-- Mensajes de alerta -->
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
        
        <!-- Formulario para crear usuario -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Crear Nuevo Usuario</h5>
            </div>
            <div class="card-body">
                <form method="POST" id="formCrearUsuario">
                    <input type="hidden" name="action" value="crear_usuario">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Nombre</label>
                            <input type="text" name="nombre" class="form-control" placeholder="Nombre completo" required>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" class="form-control" placeholder="correo@ejemplo.com" required>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Contraseña</label>
                            <input type="password" name="password" class="form-control" placeholder="Mínimo 6 caracteres" required minlength="6">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Rol</label>
                            <select name="rol" class="form-select" required>
                                <option value="">Seleccionar...</option>
                                <option value="paciente">Paciente</option>
                                <option value="doctor">Doctor</option>
                                <option value="administrador">Administrador</option>
                            </select>
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                            <button type="submit" class="btn btn-success w-100">Crear Usuario</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Lista de usuarios -->
        <div class="card">
            <div class="card-header bg-secondary text-white">
                <h5 class="mb-0">Lista de Usuarios (<?= count($usuarios) ?> registros)</h5>
            </div>
            <div class="card-body">
                <?php if (empty($usuarios)): ?>
                    <div class="alert alert-info">No hay usuarios registrados.</div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Fecha Creación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($usuarios as $usuario): ?>
                                <tr>
                                    <td><?= htmlspecialchars($usuario['id']) ?></td>
                                    <td><?= htmlspecialchars($usuario['nombre']) ?></td>
                                    <td><?= htmlspecialchars($usuario['email']) ?></td>
                                    <td>
                                        <span class="badge bg-info"><?= htmlspecialchars($usuario['rol']) ?></span>
                                    </td>
                                    <td>
                                        <span class="badge bg-<?= $usuario['activo'] ? 'success' : 'danger' ?>">
                                            <?= $usuario['activo'] ? 'Activo' : 'Inactivo' ?>
                                        </span>
                                    </td>
                                    <td><?= date('d/m/Y', strtotime($usuario['fecha_creacion'])) ?></td>
                                    <td>
                                        <div class="btn-group btn-group-sm">
                                            <button type="button" class="btn btn-warning" 
                                                    onclick="editarUsuario(<?= $usuario['id'] ?>, '<?= htmlspecialchars($usuario['nombre']) ?>', '<?= htmlspecialchars($usuario['email']) ?>', '<?= htmlspecialchars($usuario['rol']) ?>')">
                                                Editar
                                            </button>
                                            <a href="usuarios.php?action=toggle_usuario&id=<?= $usuario['id'] ?>" 
                                               class="btn btn-<?= $usuario['activo'] ? 'danger' : 'success' ?>"
                                               onclick="return confirm('¿Está seguro de <?= $usuario['activo'] ? 'desactivar' : 'activar' ?> este usuario?')">
                                                <?= $usuario['activo'] ? 'Desactivar' : 'Activar' ?>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Modal para editar usuario -->
    <div class="modal fade" id="modalEditar" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Editar Usuario</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <input type="hidden" name="action" value="modificar_usuario">
                    <input type="hidden" name="usuario_id" id="edit_usuario_id">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Nombre</label>
                            <input type="text" name="nombre" id="edit_nombre" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" name="email" id="edit_email" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Rol</label>
                            <select name="rol" id="edit_rol" class="form-select" required>
                                <option value="paciente">Paciente</option>
                                <option value="doctor">Doctor</option>
                                <option value="administrador">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
    function editarUsuario(id, nombre, email, rol) {
        document.getElementById('edit_usuario_id').value = id;
        document.getElementById('edit_nombre').value = nombre;
        document.getElementById('edit_email').value = email;
        document.getElementById('edit_rol').value = rol;
        
        var modal = new bootstrap.Modal(document.getElementById('modalEditar'));
        modal.show();
    }
    </script>
</body>
</html>