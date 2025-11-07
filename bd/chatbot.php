<?php
include 'conexion.php';

header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents("php://input"), true);
$message = strtolower(trim($data['message'] ?? ''));

$response = "No entendí tu consulta. ¿Podrías explicarlo mejor?";

// Ejemplo de respuestas dinámicas desde la base de datos
if (strpos($message, 'doctor') !== false) {
    $sql = "SELECT nombre_completo, especialidad FROM doctores LIMIT 3";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        $response = "Aquí tienes algunos doctores disponibles:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "👨‍⚕️ " . $row['nombre_completo'] . " - " . $row['especialidad'] . "\n";
        }
    } else {
        $response = "No hay doctores registrados en este momento.";
    }
}
elseif (strpos($message, 'cita') !== false) {
    $response = "Puedes agendar tu cita desde la sección 'Agendar Cita'.";
}
elseif (strpos($message, 'receta') !== false) {
    $response = "Puedes ver tus recetas médicas en la sección 'Mis Recetas'.";
}
elseif (strpos($message, 'pago') !== false) {
    $response = "Puedes revisar tus pagos en la sección de 'Historial de Pagos'.";
}

// Guardar conversación
$stmt = $conn->prepare("INSERT INTO registros_chatbot (mensaje_usuario, respuesta_bot, fecha_hora) VALUES (?, ?, NOW())");
$stmt->bind_param("ss", $message, $response);
$stmt->execute();
$stmt->close();

echo json_encode(["response" => $response]);

$conn->close();
?>
