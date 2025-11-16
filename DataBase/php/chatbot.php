<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir la conexión a la base de datos
include_once("conexion.php");

$input = json_decode(file_get_contents("php://input"), true);
$message = strtolower(trim($input['message'] ?? ''));

if ($message === '') {
    echo json_encode(["response" => "Por favor, escribe algo para que pueda ayudarte."]);
    exit;
}

$response = "🤔 No entendí tu consulta. ¿Podrías explicarlo mejor?\n\nPuedes preguntarme sobre:\n• Doctores disponibles\n• Agendar citas\n• Videoconsultas\n• Síntomas médicos";

// --- RESPUESTAS PREDEFINIDAS ---
// SALUDO
if (preg_match('/hola|buenas|hey|saludo/', $message)) {
    $response = "👋 ¡Hola! Soy tu asistente virtual de Telemedicina. ¿En qué puedo ayudarte hoy?\n\nPuedes:\n• Consultar información médica\n• Agendar citas\n• Solicitar videoconsultas\n• Obtener orientación sobre síntomas";
}
    
// DOCTORES - CONSULTA REAL A LA BASE DE DATOS
elseif (preg_match('/doctor|médico|doctores|especialista|consultar con doctor/', $message)) {
    // Consultar doctores desde la base de datos
    $sql = "SELECT nombre_completo, corre_electronico FROM usuarios WHERE role = 'Doctor' AND status = 'Activo'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $response = "👨‍⚕️ **Doctores disponibles en nuestro equipo:**\n\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "• **" . $row['nombre_completo'] . "**\n";
            $response .= "  📧 " . $row['corre_electronico'] . "\n\n";
        }
        $response .= "Puedes agendar una cita con cualquiera de ellos desde la sección 'Agendar Cita'.";
    } else {
        $response = "🚫 No hay doctores disponibles en este momento. Por favor, intenta más tarde o contacta con administración.";
    }
}

// AGENDAR CITA
elseif (preg_match('/cita|agendar|reservar/', $message)) {
    $response = "📅 **Para agendar una cita:**\n\n1. Ve a la sección 'Agendar Cita'\n2. Selecciona el tipo de consulta\n3. Elige fecha y hora preferidas\n4. Describe tus síntomas\n\n¡Te confirmaremos la cita por correo!";
}

// VIDEOCONSULTA
elseif (preg_match('/videoconsulta|videollamada/', $message)) {
    $response = "🎥 **Videoconsultas disponibles:**\n\n• Consulta General: $25.000\n• Especialista: $40.000\n• Control: $20.000\n\nHaz clic en 'Iniciar Videollamada' para conectarte con un especialista.";
}

// SÍNTOMAS
elseif (preg_match('/sintoma|dolor|enfermedad|malestar|fiebre|dolor de cabeza/', $message)) {
    $response = "😟 **Orientación médica:**\n\nSi tienes síntomas como fiebre o dolor:\n\n• Descansa y mantente hidratado\n• Monitorea tu temperatura\n• Evita la automedicación\n• Si los síntomas empeoran, consulta a un médico\n\n💡 **Para atención inmediata, agenda una cita o videoconsulta**";
}

// RECETAS
elseif (preg_match('/receta|medicamento|medicina/', $message)) {
    $response = "💊 **Sobre recetas médicas:**\n\nPuedes ver y descargar tus recetas en la sección 'Mis Recetas'. Solo un médico puede emitir recetas después de una consulta.";
}

// DESPEDIDA
elseif (preg_match('/adios|chau|hasta luego|gracias/', $message)) {
    $response = "👋 ¡Hasta luego! Que tengas un excelente día. Cuida tu salud.";
}

echo json_encode([
    "response" => $response
]);

// Cerrar conexión
if (isset($conn)) {
    $conn->close();
}
?>