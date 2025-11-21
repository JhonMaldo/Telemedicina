<?php
// conexion.php
$host = "localhost";
$user = "root";        // cambia si usas otro usuario
$pass = "";            // agrega tu contraseña si tienes una
$db = "telemed";       // nombre de tu base de datos

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Error en la conexión: " . $conn->connect_error);
}

// Forzar codificación UTF-8
$conn->set_charset("utf8");
?>
