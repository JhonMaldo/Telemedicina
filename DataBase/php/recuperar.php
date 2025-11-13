<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $email = $data['email'] ?? '';
    
    if (empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Email es requerido']);
        exit;
    }
    
    // Verificar si el email existe
    $stmt = $conn->prepare("SELECT id_usuario, nombre_completo FROM usuarios WHERE corre_electronico = ? AND status = 'Activo'");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // Generar código de recuperación (6 dígitos)
        $codigo_recuperacion = sprintf("%06d", mt_rand(1, 999999));
        $expiracion = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Limpiar códigos anteriores del mismo email
        $clean_stmt = $conn->prepare("DELETE FROM codigos_recuperacion WHERE email = ? OR expiracion < NOW()");
        $clean_stmt->bind_param("s", $email);
        $clean_stmt->execute();
        $clean_stmt->close();
        
        // Guardar código en la base de datos
        $codigo_stmt = $conn->prepare("INSERT INTO codigos_recuperacion (email, codigo, expiracion) VALUES (?, ?, ?)");
        $codigo_stmt->bind_param("sss", $email, $codigo_recuperacion, $expiracion);
        
        if ($codigo_stmt->execute()) {
            // En un entorno real, aquí enviarías el email
            // Por ahora, solo devolvemos el código para pruebas
            echo json_encode([
                'success' => true, 
                'message' => 'Código de recuperación enviado a tu email',
                'codigo' => $codigo_recuperacion // Solo para pruebas, quitar en producción
            ]);
            
            // Para enviar email real (descomenta cuando tengas configurado el servidor de email):
            /*
            $to = $email;
            $subject = "Código de Recuperación - Sistema Médico";
            $message = "Hola " . $user['nombre_completo'] . ",\n\n";
            $message .= "Tu código de recuperación es: " . $codigo_recuperacion . "\n";
            $message .= "Este código expira en 1 hora.\n\n";
            $message .= "Si no solicitaste este código, ignora este mensaje.\n";
            $headers = "From: no-reply@sistemamedico.com";
            
            mail($to, $subject, $message, $headers);
            */
            
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al generar el código de recuperación']);
        }
        
        $codigo_stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Email no encontrado en nuestro sistema']);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>