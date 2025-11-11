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
    http_response_code(500);
    echo json_encode(["response" => "⚠️ Error al conectar con la base de datos."]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$message = strtolower(trim($input['message'] ?? ''));

// Limpieza básica del mensaje
$message = preg_replace('/[^a-záéíóúüñ0-9 ]/i', '', $message);

$response = "🤔 No entendí tu consulta. ¿Podrías explicarlo mejor?";

// --- INTENCIONES ---
if (preg_match('/hola|buenas|saludo|hey/', $message)) {
    $response = "👋 ¡Hola! Soy tu asistente médico virtual. ¿Cómo te encuentras hoy?";
}

elseif (preg_match('/doctor|médico|doctores|especialista/', $message)) {
    $sql = "SELECT nombre_completo FROM usuarios WHERE role='Doctor'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $response = "👨‍⚕️ Estos son los doctores disponibles actualmente:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "- " . $row['nombre_completo'] . "\n";
        }
    } else {
        $response = "🚫 No hay doctores registrados en este momento.";
    }
}

elseif (preg_match('/paciente|mis datos|información personal|perfil/', $message)) {
    $sql = "SELECT nombre_completo, edad, correo FROM usuarios WHERE role='Paciente' LIMIT 5";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $response = "👩‍⚕️ Aquí tienes algunos pacientes registrados:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "- " . $row['nombre_completo'] . " (" . $row['edad'] . " años, " . $row['correo'] . ")\n";
        }
    } else {
        $response = "Aún no hay pacientes registrados en el sistema.";
    }
}

elseif (preg_match('/cita|agendar|consulta|reservar/', $message)) {
    $response = "📅 Puedes agendar una cita desde la sección **'Agendar Cita'** o decirme 'quiero agendar con un doctor'.";
}

elseif (preg_match('/sintoma|dolor|enfermedad|malestar|me siento mal/', $message)) {
    $response = "😟 Lamento que te sientas así. Puedes describirme tus síntomas y te daré una orientación general, aunque te recomiendo agendar una cita con un médico.";
}

elseif (preg_match('/receta|medicina|tratamiento|medicamento/', $message)) {
    $response = "💊 Las recetas médicas y tratamientos están disponibles en la sección **'Recetas Médicas'**. Si deseas, puedo listar tus últimas recetas.";
}

elseif (preg_match('/historial|resultados|examen|analisis/', $message)) {
    $response = "🧾 Tu historial médico se encuentra disponible en la sección 'Resultados Médicos'. Si quieres, puedo mostrarte tus últimos análisis registrados.";
}

elseif (preg_match('/ayuda|problema|error|soporte/', $message)) {
    $response = "🆘 Claro, puedo ayudarte. Cuéntame cuál es el problema que estás experimentando con la plataforma o tu cuenta.";
}

elseif (preg_match('/gracias|te agradezco|muy amable/', $message)) {
    $response = "😊 ¡De nada! Estoy aquí para ayudarte en todo lo que necesites.";
}

elseif (preg_match('/adios|chau|hasta luego|nos vemos/', $message)) {
    $response = "👋 ¡Hasta luego! Cuídate mucho y recuerda mantener tus citas médicas al día.";
}

// Cierre conexión
$conn->close();

// Respuesta final
echo json_encode([
    "response" => nl2br($response)
]);
?>
