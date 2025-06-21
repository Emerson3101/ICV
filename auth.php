<?php
// CONFIGURACIÓN DE ZONA HORARIA
date_default_timezone_set('America/Mexico_City');

session_name('ICV_SESION'); // o PROGRAMA_B_SESION según el programa
session_start();

$adminPassword = "123"; // Contraseña

define('ADMIN_SESSION_TIMEOUT', 1800); // 30 minutos en segundos

// Verificar si la sesión ha expirado
function isSessionExpired() {
    if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
        if (isset($_SESSION['admin_login_time'])) {
            return (time() - $_SESSION['admin_login_time']) > ADMIN_SESSION_TIMEOUT;
        }
        return true; // Si no tiene timestamp, forzar expiración
    }
    return false;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';

    if ($password === $adminPassword) {
        $_SESSION['is_admin'] = true;
        $_SESSION['admin_login_time'] = time(); // Guardar hora de autenticación
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['action'])) {
    if (isSessionExpired()) {
        session_destroy();
        echo json_encode(['is_admin' => false, 'expired' => true]);
    } else {
        echo json_encode(['is_admin' => isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true]);
    }
    exit;
}
