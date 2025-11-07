<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "telemed";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    echo json_encode(["response" => "Error de conexión a la base de datos: " . $conn->connect_error]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$message = strtolower(trim($input['message'] ?? ''));

$response = "No entendí tu consulta. ¿Podrías explicarlo mejor?";

if (strpos($message, 'hola') !== false) {
    $response = "¡Hola! Soy tu asistente médico virtual. ¿Cómo te sientes hoy?";
} elseif (strpos($message, 'doctor') !== false) {
    $sql = "SELECT nombre_completo, role FROM usuarios WHERE role='Doctor'";
    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $response = "Estos son los doctores disponibles:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "- " . $row['nombre_completo'] . "\n";
        }
    } else {
        $response = "No hay doctores registrados en este momento.";
    }
} elseif (strpos($message, 'cita') !== false) {
    $response = "Puedes agendar una cita desde la sección 'Agendar Cita'.";
}

$conn->close();
echo json_encode(["response" => nl2br($response)]);
?>
