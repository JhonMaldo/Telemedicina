<?php
<?php
require_once '../../DataBase/php/conexion.php';

// Listar
if (isset($_GET['action']) && $_GET['action'] == 'listar') {
    $result = $conn->query("SELECT id_paciente, nombre, edad, email FROM pacientes ORDER BY id_paciente DESC");
    $pacientes = [];
    while ($row = $result->fetch_assoc()) $pacientes[] = $row;
    header('Content-Type: application/json');
    echo json_encode($pacientes);
    exit;
}

// Agregar o actualizar
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id = isset($_POST['id_paciente']) ? intval($_POST['id_paciente']) : 0;
    $nombre = $_POST['nombre'];
    $edad = $_POST['edad'];
    $email = $_POST['email'];

    if ($id > 0) {
        $stmt = $conn->prepare("UPDATE pacientes SET nombre=?, edad=?, email=? WHERE id_paciente=?");
        $stmt->bind_param("sisi", $nombre, $edad, $email, $id);
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("INSERT INTO pacientes (nombre, edad, email) VALUES (?, ?, ?)");
        $stmt->bind_param("sis", $nombre, $edad, $email);
        $stmt->execute();
    }
    exit;
}

// Eliminar
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action']) && $_POST['action'] == 'eliminar') {
    $id = intval($_POST['id_paciente']);
    $conn->query("DELETE FROM pacientes WHERE id_paciente = $id");
    exit;
}
?>