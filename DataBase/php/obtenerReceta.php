<?php
header('Content-Type: application/json');
include 'conexion.php';

try {
    if (!isset($_GET['id'])) {
        echo json_encode(["error" => "No se recibió el ID de receta"]);
        exit;
    }

    $id = intval($_GET['id']);

    // ⬇️⬇️⬇️ MODIFICADO: Usar MySQLi en lugar de PDO y agregar validación de doctor ⬇️⬇️⬇️
    $sql = "SELECT r.*,
                   u.nombre_completo AS paciente_nombre,
                   d.nombre_completo AS doctor_nombre,
                   d.especialidad AS doctor_especialidad,
                   d.numero_licencia AS doctor_cedula
            FROM receta_medica r
            INNER JOIN pacientes p ON r.id_paciente = p.id_paciente
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            INNER JOIN doctores d ON r.id_doctor = d.id_doctor
            WHERE r.id_receta_medica = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $receta = $result->fetch_assoc();

    if (!$receta) {
        echo json_encode(["error" => "Receta no encontrada"]);
        exit;
    }

    // PROCESAR la_receta (porque tu JS ya separa los campos por título)
    $texto = $receta['la_receta'];

    // Extraer medicamentos, instrucciones y validez
    $receta['medicamentos'] = "";
    $receta['instrucciones'] = "";
    $receta['validez_dias'] = 30;

    if (strpos($texto, "TRATAMIENTO PRESCRITO:") !== false) {
        $partes = explode("INSTRUCCIONES ESPECIALES:", $texto);

        $receta['medicamentos'] = trim(str_replace("TRATAMIENTO PRESCRITO:", "", $partes[0]));

        if (isset($partes[1])) {
            $sub = explode("VÁLIDA POR:", $partes[1]);
            $receta['instrucciones'] = trim($sub[0]);

            if (isset($sub[1])) {
                $receta['validez_dias'] = intval(
                    filter_var($sub[1], FILTER_SANITIZE_NUMBER_INT)
                );
            }
        }
    }

    echo json_encode($receta);

} catch (Exception $e) {
    echo json_encode(["error" => "Error al obtener la receta: " . $e->getMessage()]);
}

$conn->close();
?>