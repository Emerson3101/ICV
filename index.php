<?php
/**
 * Índice de Calidad de Voltaje - ZOTGM
 * 
 * @author Emerson Salvador Plancarte Cerecedo
 * @version 2025
 * @description Sistema de monitoreo y evaluación de calidad de voltaje para la Zona de Operación de Transmisión Guerrero Morelos
 * 
 * Características principales:
 * - Monitoreo de parámetros de voltaje en tiempo real
 * - Evaluación automática de infracciones
 * - Cálculo de Índice de Calidad de Voltaje (ICV)
 * - Sistema de paginación y búsqueda avanzada
 * - Exportación de datos a Excel y CSV
 * - Dashboard con métricas y gráficas
 */

// CONFIGURACIÓN DE ZONA HORARIA
date_default_timezone_set('America/Mexico_City');

// CORRECCIÓN AUTOMÁTICA DE EVAL.JSON (UNA SOLA VEZ)
if (file_exists('corregir_eval.php')) {
    include_once 'corregir_eval.php';
}

// LIMPIEZA AUTOMÁTICA DE ARCHIVOS DE CONTROL
if (file_exists('limpiar_control.php')) {
    include_once 'limpiar_control.php';
}

// OPTIMIZACIÓN 1: Headers de cache optimizados
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

// OPTIMIZACIÓN 2: Generación optimizada de fechas
$dayone = date('Y-m-01');
$daypresent = date('Y-m-d');
?>
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Índice de Calidad de Voltaje - ZOTGM</title>

  <!-- OPTIMIZACIÓN 3: Carga optimizada de recursos -->
  <link rel="stylesheet" href="estilo.css" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet" />

  <!-- OPTIMIZACIÓN 4: Carga optimizada de jQuery -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  
  <!-- NUEVAS LIBRERÍAS PARA GRÁFICAS Y DASHBOARD -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
</head>

<body>
  <!-- Modal para inicio de sesión administrador -->
  <div class="modal fade" id="modalAdmin" tabindex="-1" aria-labelledby="modalAdminLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="modalAdminLabel">Autenticación de Administrador</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label for="admin-password" class="form-label">Contraseña:</label>
            <input type="password" class="form-control" id="admin-password" placeholder="Ingresa la contraseña" />
            <div id="admin-feedback" class="form-text text-danger d-none">Contraseña incorrecta.</div>
            <div id="admin-success" class="form-text text-success d-none">¡Inicio de sesión exitoso!</div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="confirm-admin" class="btn btn-primary">Entrar</button>
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
  <!-- Modal de carga -->
  <div class="modal fade" id="loadingModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static"
    data-bs-keyboard="false">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-dark text-white">
        <div class="modal-body d-flex align-items-center justify-content-center">
          <div class="spinner-border text-light me-3" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <div>Cargando datos, por favor espere...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Barra de navegación -->
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container d-flex justify-content-between align-items-center"
      style="width: 90vw; max-width: 100%; margin: 0 auto; position: relative;">

      <!-- Izquierda: logo y botón toggle -->
      <div class="d-flex align-items-center" style="gap: 0.5rem;">
        <a class="navbar-brand" href="http://10.25.117.65/zotgm/inicio.php" style="padding: 0;">
          <img src="cfe_logo.png" alt="Logo" width="120" height="120" class="d-inline-block align-text-top" />
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContenido"
          aria-controls="navbarContenido" aria-expanded="false" aria-label="Alternar navegación">
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>

      <!-- Centro: título centrado -->
      <div id="titulo-navbar" class="text-center fs-4 fw-bold text-wrap text-truncate"
        style="position: absolute; left: 50%; transform: translateX(-50%); max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none;">
        Índice de Calidad de Voltaje de la ZOTGM
      </div>

      <!-- Derecha: menú colapsable y botón admin -->
      <div class="collapse navbar-collapse d-flex justify-content-end align-items-center" id="navbarContenido"
        style="gap: 1rem;">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link" href="http://10.25.117.67/cargabilidad">SCRE de la ZOTGM</a>
          </li>
        </ul>
        <div id="admin-button-container"></div>
      </div>

    </div>
  </nav>


  <div id="timestamp-reciente" class="alert alert-info mx-auto" style="width: 90%; text-align: left;">
    <strong style="text-decoration: underline">INFO:</strong> <span id="timestamp"></span>
  </div>

  <!-- NUEVO DASHBOARD CON MÉTRICAS -->
  <div class="container-fluid" style="max-width: 90%; margin: 0 auto;">
    <div class="row mb-4 dashboard-metrics" id="dashboard-metrics" style="display: none;">
      <div class="col-md-3 mb-3">
        <div class="card bg-primary text-white h-100 dashboard-card">
          <div class="card-body text-center">
            <i class="bi bi-lightning-charge fs-1 mb-2"></i>
            <h5 class="card-title metric-label">Total Infracciones</h5>
            <h3 class="card-text metric-value" id="metric-total-infracciones">0</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card bg-success text-white h-100 dashboard-card">
          <div class="card-body text-center">
            <i class="bi bi-check-circle fs-1 mb-2"></i>
            <h5 class="card-title metric-label">Infracciones Válidas</h5>
            <h3 class="card-text metric-value" id="metric-infracciones-validas">0</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card bg-warning text-dark h-100 dashboard-card">
          <div class="card-body text-center">
            <i class="bi bi-x-circle fs-1 mb-2"></i>
            <h5 class="card-title metric-label">Infracciones Justificadas</h5>
            <h3 class="card-text metric-value" id="metric-infracciones-justificadas">0</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-3">
        <div class="card bg-info text-white h-100 dashboard-card">
          <div class="card-body text-center">
            <i class="bi bi-graph-up fs-1 mb-2"></i>
            <h5 class="card-title metric-label">ICV Global (seg)</h5>
            <h3 class="card-text metric-value" id="metric-icv-promedio">0 seg</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- NUEVAS GRÁFICAS -->
    <div class="row mb-4" id="dashboard-charts" style="display: none;">
      <div class="col-md-6 mb-3">
        <div class="card dashboard-card">
          <div class="card-header">
            <h5 class="card-title mb-0"><i class="bi bi-bar-chart me-2"></i>Tiempo Total de Infracciones por Nivel de Tensión</h5>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="chartNivelTension" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-3">
        <div class="card dashboard-card">
          <div class="card-header">
            <h5 class="card-title mb-0"><i class="bi bi-pie-chart me-2"></i>Distribución de Evaluaciones</h5>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="chartEvaluaciones" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-12 mb-3">
        <div class="card dashboard-card">
          <div class="card-header">
            <h5 class="card-title mb-0"><i class="bi bi-graph-up me-2"></i>Infracciones por Nodo (Todos los Nodos)</h5>
          </div>
          <div class="card-body">
            <div class="chart-container-scrollable" style="height: 600px; overflow-y: auto;">
              <div class="chart-container" style="height: 800px; min-height: 800px;">
                <canvas id="chartTopNodos" width="400" height="800"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NUEVOS FILTROS AVANZADOS -->
    <div class="row mb-4" id="filtros-avanzados" style="display: none;">
      <div class="col-12">
        <div class="card filtros-card">
          <div class="card-header">
            <h5 class="card-title mb-0"><i class="bi bi-funnel me-2"></i>Filtros Avanzados</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-2">
                <label for="filtro-nivel" class="form-label">Nivel de Tensión</label>
                <select class="form-select" id="filtro-nivel">
                  <option value="">Todos los niveles</option>
                </select>
              </div>
              <div class="col-md-3 mb-2">
                <label for="filtro-evaluacion" class="form-label">Evaluación</label>
                <select class="form-select" id="filtro-evaluacion">
                  <option value="">Todas las evaluaciones</option>
                  <option value="cuenta">Cuenta</option>
                  <option value="nocuenta">No cuenta</option>
                  <option value="sin-evaluar">Sin evaluar</option>
                </select>
              </div>
              <div class="col-md-3 mb-2">
                <label for="filtro-nodo" class="form-label">Buscar Nodo</label>
                <input type="text" class="form-control" id="filtro-nodo" placeholder="Nombre del nodo...">
              </div>
              <div class="col-md-3 mb-2">
                <label class="form-label">&nbsp;</label>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-primary flex-fill" id="aplicar-filtros">
                    <i class="bi bi-search me-1"></i>Aplicar Filtros
                  </button>
                  <button type="button" class="btn btn-secondary flex-fill" id="limpiar-filtros">
                    <i class="bi bi-x-circle me-1"></i>Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container-fluid d-flex justify-content-center align-items-center">
    <div class="w-100" style="max-width: 90%;">
      <div class="mb-4">
        <form id="form-fechas" action="procesar.php" method="post">
          <div class="row g-3 align-items-end">
            <div class="col-12">
              <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">

                <div class="flex-fill" style="min-width: 120px;">
              <label for="fecha-inicial" class="form-label">Fecha inicial:</label>
              <input type="date" id="fecha-inicial" name="fecha_inicial" class="form-control w-100"
                value="<?php echo $dayone; ?>" required>
            </div>

                <div class="flex-fill" style="min-width: 120px;">
              <label for="fecha-final" class="form-label">Fecha final:</label>
              <input type="date" id="fecha-final" name="fecha_final" class="form-control w-100"
                value="<?php echo $daypresent; ?>" required>
            </div>

                <div class="flex-fill" style="min-width: 120px;">
              <button type="submit" class="btn btn-primary w-100">Enviar</button>
            </div>

                <div class="flex-fill" style="min-width: 120px;">
              <button type="button" class="btn btn-success w-100" id="guardar-evaluacion">Guardar Evaluación</button>
            </div>

                <div class="flex-fill" style="min-width: 120px;">
              <button type="button" class="btn btn-success w-100" id="calcular-promedio">Calcular ICV</button>
            </div>

                <div class="flex-fill" style="min-width: 120px;">
                  <div class="dropdown">
                    <button class="btn btn-info w-100 dropdown-toggle" type="button" id="exportarDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                      <i class="bi bi-download me-1"></i>Exportar
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="exportarDropdown">
                      <li><a class="dropdown-item" href="#" id="exportar-xls"><i class="bi bi-file-earmark-excel me-2"></i>Excel (.xls)</a></li>
                      <li><a class="dropdown-item" href="#" id="exportar-csv"><i class="bi bi-file-earmark-text me-2"></i>CSV (.csv)</a></li>
                    </ul>
                  </div>
                </div>

                <div class="flex-fill" style="min-width: 120px;">
                  <button type="button" class="btn btn-outline-primary w-100" id="toggle-dashboard">
                    <i class="bi bi-graph-up me-1"></i>Dashboard
                  </button>
                </div>

              </div>
            </div>
          </div>
        </form>
      </div>


      <div>
        <h5 class="text-center">Valores fuera de límites</h5>
        
        <!-- CONTROLES DE PAGINACIÓN Y BÚSQUEDA -->
        <div class="row mb-3" id="controles-tabla" style="display: none;">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="busqueda-tabla" placeholder="Buscar en nodos, valores, timestamps...">
              <button class="btn btn-outline-secondary" type="button" id="limpiar-busqueda">
                <i class="bi bi-x-circle"></i>
              </button>
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filas-por-pagina">
              <option value="50">50 filas</option>
              <option value="100" selected>100 filas</option>
              <option value="200">200 filas</option>
              <option value="500">500 filas</option>
              <option value="1000">1000 filas</option>
            </select>
          </div>
          <div class="col-md-3">
            <div class="d-flex justify-content-end align-items-center">
              <span class="me-2">Página:</span>
              <div class="btn-group" role="group" id="navegacion-paginas">
                <button type="button" class="btn btn-outline-primary btn-sm" id="pagina-anterior">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <span class="btn btn-outline-primary btn-sm" id="pagina-actual">1</span>
                <button type="button" class="btn btn-outline-primary btn-sm" id="pagina-siguiente">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- INFORMACIÓN DE RESULTADOS -->
        <div class="row mb-2" id="info-resultados" style="display: none;">
          <div class="col-12">
            <div class="alert alert-info py-2 mb-0">
              <small>
                <i class="bi bi-info-circle me-1"></i>
                Mostrando <span id="filas-mostradas">0</span> de <span id="total-filas">0</span> registros 
                (Página <span id="pagina-info">1</span> de <span id="total-paginas">1</span>)
              </small>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-bordered table-sm text-center align-middle" id="tablagen">
            <thead class="table-light sticky-top">
              <tr>
                <!-- Encabezados de columna con ordenamiento -->
                <th>No. de<br>Infracción</th>
                <th><span class="ordenar" data-col="1">Nodo <span class="flecha"></span></span></th> <!--Nodo del PI -->
                <th><span class="ordenar" data-col="2">Nivel de<br>Tensión<span class="flecha"></span></span></th>
                <!--Nivel de tensión del nodo infraccionado -->
                <th><span class="ordenar" data-col="3">Hora de<br>salida<span class="flecha"></span></span></th>
                <!--Muestra la hora en que el valor de la línea salió fuera de límites -->
                <th>Hora de<br>entrada</th>
                <!--Muestra la hora de cambio en la que el valor infraccionado cambió o volvió a su límite -->
                <th>Valor</th> <!--Muestra el valor que tuvo la línea al salir del límite -->
                <th>Tiempo<br>Fuera</th> <!--Muestra cuánto tiempo el valor estuvo fuera de límites -->
                <th>Limite<br>Inferior</th> <!--Límite inferior del nodo -->
                <th>Limite<br>Superior</th> <!--Límite superior del nodo -->
                <th>Evaluación</th> <!--Campo de evaluación que justifica la veracidad de una infracción -->
                <th>Justificación</th>
                <!--Campo de texto en el que se justifica el porqué un valor no cuenta como infracción -->
              </tr>
            </thead>

            <tbody id="tabla-resultados">
              <!-- Mensaje por defecto si no hay datos -->
              <tr>
                <td colspan="11" class="text-center">No hay datos disponibles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mostrar el resultado del promedio ICV -->
      <div class="text-center mt-3">
        <div id="resultado-promedio" class="fw-bold fs-5 text-primary"></div>
      </div>
    </div>
  </div>

  <!-- Bootstrap Bundle JS (incluye Popper) -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Scripts personalizados -->
  <script src="dataproc.js"></script>
  <script src="autenticacion.js"></script>
  <script src="dashboard.js"></script>
  <script src="paginacion.js"></script>

  <!-- OPTIMIZACIÓN 5: Inicialización optimizada -->
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      // OPTIMIZACIÓN 6: Inicialización optimizada de tooltips
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      const tooltipList = Array.from(tooltipTriggerList).map(tooltipTriggerEl => 
        new bootstrap.Tooltip(tooltipTriggerEl)
      );
    });
  </script>
</body>

</html>