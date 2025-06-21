/**
 * Sistema de Autenticación ICV - ZOTGM
 * 
 * @author Emerson Salvador Plancarte Cerecedo
 * @version 2025
 * @description Sistema de autenticación y gestión de permisos para administradores
 * 
 * Funcionalidades:
 * - Autenticación de administradores
 * - Gestión de sesiones seguras
 * - Control de acceso a funciones administrativas
 * - Interfaz de login modal
 * - Validación de credenciales
 * - Logout y limpieza de sesiones
 */

$(document).ready(function () {
  let isAdmin = false;

  // OPTIMIZACIÓN 1: Cache de elementos DOM
  const $container = $('#admin-button-container');
  const $modal = $('#modalAdmin');
  const $password = $('#admin-password');
  const $feedback = $('#admin-feedback');
  const $success = $('#admin-success');

  // OPTIMIZACIÓN 2: Templates predefinidos
  const templates = {
    loginButton: `
        <button id="admin-login-btn" class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#modalAdmin" title="Iniciar sesión como administrador">
          <i class="bi bi-gear"></i> Iniciar sesión como administrador
        </button>
    `,
    dropdown: `
        <div class="dropdown">
          <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="adminDropdownBtn" data-bs-toggle="dropdown" aria-expanded="false" title="Administrador de nodos">
            <i class="bi bi-gear"></i> Administrador
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="adminDropdownBtn">
            <li><a class="dropdown-item" href="tagadmin.php">Administrador de nodos</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="admin-logout">Cerrar sesión</a></li>
          </ul>
        </div>
    `
  };

  // OPTIMIZACIÓN 3: Función de renderizado optimizada
  function renderAdminButton() {
    $container.empty().append(isAdmin ? templates.dropdown : templates.loginButton);
        }

  // OPTIMIZACIÓN 4: Eventos optimizados con delegación
  $container.on('click', '#admin-logout', function (e) {
    e.preventDefault();
    $.ajax({
      url: 'auth.php?action=logout',
      method: 'GET',
      dataType: 'json',
      success: function () {
        isAdmin = false;
        renderAdminButton();
      },
      error: function () {
        alert('Error al cerrar sesión');
      }
    });
  });

  // OPTIMIZACIÓN 5: Timeout optimizado
  $modal.on('shown.bs.modal', function () {
    $password.val('').focus();
    $feedback.addClass('d-none');
    $success.addClass('d-none');
  });

  $('#confirm-admin').click(function () {
    const entered = $password.val();
    $.ajax({
      url: 'auth.php',
      method: 'POST',
      data: { password: entered },
      dataType: 'json',
      success: function (response) {
        if (response.success) {
          isAdmin = true;
          renderAdminButton();
          $feedback.addClass('d-none');
          $success.removeClass('d-none');
          
          setTimeout(() => {
            $modal.modal('hide');
            $success.addClass('d-none');
            $password.val('');
          }, 1500);
        } else {
          $feedback.removeClass('d-none').text(response.message || 'Contraseña incorrecta');
          $success.addClass('d-none');
        }
      },
      error: function () {
        $feedback.removeClass('d-none').text('Error de conexión');
        $success.addClass('d-none');
      }
    });
  });

  // Consultar estado de sesión en el servidor al cargar la página
  $.ajax({
    url: 'auth.php',
    method: 'GET',
    dataType: 'json',
    success: function (response) {
      isAdmin = !!response.is_admin;
      renderAdminButton();
    },
    error: function () {
      isAdmin = false;
  renderAdminButton();
    }
  });
});
