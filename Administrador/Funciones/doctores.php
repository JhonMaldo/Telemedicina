<?php
<?php
require_once '../../DataBase/php/conexion.php';

// Listar
if (isset($_GET['action']) && $_GET['action'] == 'listar') {
    $result = $conn->query("SELECT id_doctor, nombre, especialidad, email FROM doctores ORDER BY id_doctor DESC");
    $doctores = [];
    while ($row = $result->fetch_assoc()) $doctores[] = $row;
    header('Content-Type: application/json');
    echo json_encode($doctores);
    exit;
}

// Agregar o actualizar
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id = isset($_POST['id_doctor']) ? intval($_POST['id_doctor']) : 0;
    $nombre = $_POST['nombre'];
    $especialidad = $_POST['especialidad'];
    $email = $_POST['email'];

    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE doctores SET nombre=?, especialidad=?, email=? WHERE id_doctor=?");
        $stmt->bind_param("sssi", $nombre, $especialidad, $email, $id);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("INSERT INTO doctores (nombre, especialidad, email) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $nombre, $especialidad, $email);
        $stmt->execute();
    }
    exit;
}

// Eliminar
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action']) && $_POST['action'] == 'eliminar') {
    $id = intval($_POST['id_doctor']);
    $conn->query("DELETE FROM doctores WHERE id_doctor = $id");
    exit;
}
?>