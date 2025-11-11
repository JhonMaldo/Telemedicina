<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once("conexion.php");

$input = json_decode(file_get_contents("php://input"), true);
$message = strtolower(trim($input['message'] ?? ''));

if ($message === '') {
    echo json_encode(["response" => "Por favor, escribe algo para que pueda ayudarte."]);
    exit;
}

// Limpieza del mensaje
$message = preg_replace('/[^a-záéíóúüñ0-9 ]/i', '', $message);
$response = "🤔 No entendí tu consulta. ¿Podrías explicarlo mejor?";

// --- INTENCIONES ---
// SALUDO
if (preg_match('/hola|buenas|hey|saludo/', $message)) {
    $response = "👋 ¡Hola! Soy tu asistente virtual de Telemedicina. ¿En qué puedo ayudarte hoy?";
}

// LISTA DE DOCTORES
elseif (preg_match('/doctor|médico|doctores|especialista/', $message)) {
    $sql = "SELECT nombre, especialidad FROM doctores LIMIT 5";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $response = "👨‍⚕️ Estos son algunos de nuestros doctores disponibles:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "- " . $row['nombre'] . " (" . $row['especialidad'] . ")\n";
        }
    } else {
        $response = "🚫 No hay doctores registrados actualmente.";
    }
}

// PACIENTES REGISTRADOS (ejemplo)
elseif (preg_match('/paciente|mi perfil|mis datos/', $message)) {
    $sql = "SELECT nombre, edad, correo FROM pacientes LIMIT 3";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $response = "🩺 Algunos pacientes registrados son:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "- " . $row['nombre'] . " (" . $row['edad'] . " años, " . $row['correo'] . ")\n";
        }
    } else {
        $response = "Aún no hay pacientes registrados.";
    }
}

// AGENDAR CITA
elseif (preg_match('/cita|agendar|reservar|consulta/', $message)) {
    $response = "📅 Puedes agendar una cita desde la sección **'Agendar Cita'** o decirme 'quiero una cita con un doctor'.";
}

// SÍNTOMAS O ENFERMEDAD
elseif (preg_match('/sintoma|dolor|enfermedad|malestar|me siento mal/', $message)) {
    $response = "😟 Lamento que te sientas mal. Cuéntame tus síntomas y puedo orientarte brevemente. También te recomiendo agendar una cita médica.";
}

// RECETAS MÉDICAS
elseif (preg_match('/receta|tratamiento|medicamento|medicina/', $message)) {
    $sql = "SELECT r.id_receta, d.nombre AS doctor, r.fecha 
            FROM receta_medica r 
            INNER JOIN doctores d ON r.id_doctor = d.id_doctor 
            ORDER BY r.fecha DESC LIMIT 3";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $response = "💊 Tus últimas recetas médicas registradas:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "- Receta #" . $row['id_receta'] . " emitida por " . $row['doctor'] . " el " . $row['fecha'] . "\n";
        }
    } else {
        $response = "No hay recetas médicas registradas.";
    }
}

// HISTORIAL MÉDICO
elseif (preg_match('/historial|examen|resultado|analisis/', $message)) {
    $sql = "SELECT descripcion, fecha FROM historial_medico ORDER BY fecha DESC LIMIT 3";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $response = "📋 Últimos registros en tu historial médico:\n";
        while ($row = $result->fetch_assoc()) {
            $response .= "- " . $row['descripcion'] . " (" . $row['fecha'] . ")\n";
        }
    } else {
        $response = "No hay historial médico disponible.";
    }
}

// PAGO / FACTURACIÓN
elseif (preg_match('/pago|tarjeta|factura|metodo de pago/', $message)) {
    $response = "💳 Puedes realizar tus pagos en la sección **'Pagos'**. Aceptamos tarjeta de crédito, débito o transferencias bancarias.";
}

// DESPEDIDA
elseif (preg_match('/adios|chau|hasta luego|nos vemos/', $message)) {
    $response = "👋 ¡Hasta luego! Cuídate y recuerda mantener tus controles médicos al día.";
}

// GUARDAR REGISTRO DEL CHAT
$stmt = $conn->prepare("INSERT INTO registros_chatbot (mensaje_usuario, respuesta_bot, fecha) VALUES (?, ?, NOW())");
$stmt->bind_param("ss", $message, $response);
$stmt->execute();
$stmt->close();

$conn->close();

echo json_encode([
    "response" => nl2br($response)
]);
?>
