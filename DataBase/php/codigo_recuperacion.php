<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

require_once "../conexion.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Cargar PHPMailer manual
require_once __DIR__ . "/libs/Exception.php";
require_once __DIR__ . "/libs/PHPMailer.php";
require_once __DIR__ . "/libs/SMTP.php";



$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["email"])) {
    echo json_encode(["success" => false, "message" => "Email requerido"]);
    exit;
}

$email = $data["email"];

// Verificar si existe el correo
$sqlUser = $conn->query("SELECT id FROM usuarios WHERE email='$email' LIMIT 1");

if ($sqlUser->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "El correo no está registrado"]);
    exit;
}

// Generar código
$codigo = rand(100000, 999999);

// Guardarlo
$conn->query("UPDATE usuarios SET codigo_recuperacion='$codigo' WHERE email='$email'");

// Enviar email
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = "smtp.gmail.com";
    $mail->SMTPAuth = true;
    $mail->Username = "TU_CORREO@gmail.com";
    $mail->Password = "TU_CLAVE_APP"; // NO tu contraseña normal
    $mail->Port = 587;
    $mail->SMTPSecure = "tls";

    $mail->setFrom("TU_CORREO@gmail.com", "Soporte");
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = "Código de recuperación";
    $mail->Body = "<h3>Tu código es: <b>$codigo</b></h3>";

    $mail->send();

    echo json_encode(["success" => true, "message" => "Código enviado con éxito"]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error al enviar el correo", "error" => $e->getMessage()]);
}

?>
