<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "telemed";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => true, "response" => "Error al conectar a la base de datos."]));
}
?>
