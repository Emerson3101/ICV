<?php
/**
 * Procesamiento de Datos ICV - ZOTGM
 * 
 * @author Emerson Salvador Plancarte Cerecedo
 * @version 2025
 * @description Backend para procesamiento de datos de infracciones y cálculos ICV
 * 
 * Funcionalidades:
 * - Procesamiento de datos de infracciones de voltaje
 * - Cálculo automático de tiempos fuera de límites
 * - Guardado de evaluaciones de infracciones
 * - Generación de reportes y estadísticas
 * - Integración con archivos JSON de configuración
 */

// CONFIGURACIÓN DE ZONA HORARIA
date_default_timezone_set('America/Mexico_City');

// Configuración de headers para JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Verifica que la solicitud sea POST
if ($_SERVER["REQUEST_METHOD"] === "POST") {

    // Si se solicita vaciar las evaluaciones existentes
    if (isset($_POST["vaciar"]) && $_POST["vaciar"] == "true") {
        // OPTIMIZACIÓN 1: Escritura optimizada de archivos
        file_put_contents("eval.json", "{}");
        file_put_contents("filtrados.json", "{}");
        echo json_encode(["success" => true, "message" => "Archivo vaciado"]);
        exit;
    }

    // Si llegan evaluaciones para ser guardadas
    if (isset($_POST["evaluaciones"])) {
        // OPTIMIZACIÓN 2: Decodificación JSON optimizada
        $evaluaciones = json_decode($_POST["evaluaciones"], true);
        if ($evaluaciones === null) {
            header('Content-Type: application/json');
            echo json_encode(["success" => false, "message" => "Error en formato de datos"]);
            exit;
        }

        $archivoEval = "eval.json";

        // OPTIMIZACIÓN 3: Carga optimizada de contenido existente
        $contenidoExistente = file_exists($archivoEval) ? json_decode(file_get_contents($archivoEval), true) : [];
        if ($contenidoExistente === null) {
            $contenidoExistente = [];
        }

        // OPTIMIZACIÓN 4: Procesamiento en lote de evaluaciones
        foreach ($evaluaciones as $evaluacion) {
            $descripcion = trim($evaluacion["descripcion"]);
            $tag = $evaluacion["tag"];
            $timestamp = $evaluacion["timestamp"];
            $cuenta = $evaluacion["cuenta"];
            $nocuenta = $evaluacion["nocuenta"];

            if (!isset($contenidoExistente[$tag])) {
                $contenidoExistente[$tag] = [];
            }

            $contenidoExistente[$tag][$timestamp] = [
                "cuenta" => $cuenta,
                "nocuenta" => $nocuenta,
                "descripcion" => $descripcion,
            ];
        }

        // OPTIMIZACIÓN 5: Guardado optimizado
        $resultado = file_put_contents($archivoEval, json_encode($contenidoExistente, JSON_PRETTY_PRINT));
        
        header('Content-Type: application/json');
        if ($resultado !== false) {
            echo json_encode(["success" => true, "message" => "Evaluaciones guardadas correctamente"]);
        } else {
            echo json_encode(["success" => false, "message" => "Error al escribir archivo"]);
        }
        exit;
    }

    // -------------------------
    // Si no fue guardar evaluaciones, entonces es procesar datos
    // -------------------------

    // Captura las fechas enviadas por el formulario
    $fecha_inicial = $_POST["fecha_inicial"] ?? null;
    $fecha_final = $_POST["fecha_final"] ?? null;

    // Valida que ambas fechas hayan sido proporcionadas
    if (!$fecha_inicial || !$fecha_final) {
        http_response_code(400);
        echo json_encode(["error" => "Fechas no proporcionadas"]);
        exit;
    }

    // Aumenta límites de tiempo y memoria para procesamiento intensivo
    set_time_limit(0);
    ini_set('memory_limit', '10G');

    // // Ejecuta el programa ICVDatalink.exe pasando las fechas
    $cmd = "ICVDatalink.exe \"$fecha_inicial\" \"$fecha_final\"";
    exec($cmd, $salida, $codigoSalida);

    // Si hubo error al ejecutar el comando, muestra el error
    if ($codigoSalida !== 0) {
         echo "Ocurrió un error al ejecutar el análisis.<br>";
         echo "<pre>" . implode("\n", $salida) . "</pre>";
     }

    // -------------------------
    // Carga datos generados
    // -------------------------

    // OPTIMIZACIÓN 6: Carga optimizada de archivos JSON
    $resultadosRaw = file_get_contents("resultados.json");
    $tagsRaw = file_get_contents("tags.json");
    $evalRaw = file_exists("eval.json") ? file_get_contents("eval.json") : '{}';

    if ($resultadosRaw === false || $tagsRaw === false) {
        echo json_encode(["error" => "Error al cargar archivos de datos"]);
        exit;
    }

    $resultados = json_decode($resultadosRaw, true);
    $tags = json_decode($tagsRaw, true);
    $evaluaciones = json_decode($evalRaw, true);

    if ($resultados === null || $tags === null) {
        echo json_encode(["error" => "Error al decodificar archivos JSON"]);
        exit;
    }

    if ($evaluaciones === null) {
        $evaluaciones = [];
    }

    // -------------------------
    // Crea un índice rápido de límites por tag
    // -------------------------

    // OPTIMIZACIÓN 7: Índice hash optimizado
    $limites = [];
    foreach ($tags as $tag) {
        if (isset($tag["tag"], $tag["limiteInferior"], $tag["limiteSuperior"])) {
            $limites[$tag["tag"]] = [
                "limiteInferior" => (float)$tag["limiteInferior"],
                "limiteSuperior" => (float)$tag["limiteSuperior"],
                "nivel_tension" => (int)$tag["nivel_tension"]
            ];
        }
    }

    // -------------------------
    // Filtra solo valores fuera de límites
    // -------------------------

    // OPTIMIZACIÓN 8: Estructuras de datos optimizadas
    $filtrados = [];
    $vistos = [];
    $total = count($resultados);

    // OPTIMIZACIÓN 9: Procesamiento optimizado con índices
    for ($i = 0; $i < $total; $i++) {
        $item = $resultados[$i];
        $tag = $item["tag"];
        $valor = (float)$item["value"];
        $timestamp = $item["timestamp"];

        if (!isset($limites[$tag])) continue;

        $limInf = $limites[$tag]["limiteInferior"];
        $limSup = $limites[$tag]["limiteSuperior"];
        $nivel_tension = $limites[$tag]["nivel_tension"];

        $clave = "$tag|$timestamp";
        if (isset($vistos[$clave])) continue;

        if ($valor < $limInf || $valor > $limSup) {
            $inicioTimestamp = $timestamp;
            $inicioUnix = strtotime($timestamp);
            $valorInicio = $valor;

            // OPTIMIZACIÓN 10: Cache de evaluaciones
            $cuenta = false;
            $nocuenta = false;
            $descripcion = "";
            if (isset($evaluaciones[$tag][$timestamp])) {
                $eval = $evaluaciones[$tag][$timestamp];
                $cuenta = $eval["cuenta"] ?? false;
                $nocuenta = $eval["nocuenta"] ?? false;
                $descripcion = $eval["descripcion"] ?? "";
            }

            $sigtimestamp = null;
            $finUnix = $inicioUnix;

            // OPTIMIZACIÓN 11: Búsqueda optimizada de eventos
            for ($j = $i + 1; $j < $total; $j++) {
                $siguiente = $resultados[$j];

                if ($siguiente["tag"] !== $tag) break;

                $sigValor = (float)$siguiente["value"];
                $sigTimestamp = $siguiente["timestamp"];
                $sigUnix = strtotime($sigTimestamp);

                $claveSig = "$tag|$sigTimestamp";
                $vistos[$claveSig] = true;

                if ($sigValor >= $limInf && $sigValor <= $limSup) {
                    $sigtimestamp = $sigTimestamp;
                    $finUnix = $sigUnix;
                    break;
                }

                $finUnix = $sigUnix;
            }

            $tiempoTotal = $finUnix - $inicioUnix;

            // Solo registrar si la duración del evento es de 1 segundo o más
            if ($tiempoTotal >= 1) {
                // Verifica si la infracción cruza días
                $diaInicio = date("Y-m-d", $inicioUnix);
                $diaFin = date("Y-m-d", $finUnix);

                if ($diaInicio !== $diaFin) {
                    // OPTIMIZACIÓN 12: Procesamiento optimizado de eventos que cruzan días
                    $inicioActual = $inicioUnix;
                    while ($inicioActual < $finUnix) {
                        $inicioDia = $inicioActual;
                        $finDia = strtotime(date("Y-m-d", $inicioDia) . " 23:59:59");
                        $finActual = min($finDia, $finUnix);

                        $filtrados[] = [
                            "tag" => $tag,
                            "value" => $valorInicio,
                            "timestamp" => date("Y-m-d H:i:s", $inicioDia),
                            "limiteInferior" => $limInf,
                            "limiteSuperior" => $limSup,
                            "cuenta" => $cuenta,
                            "nocuenta" => $nocuenta,
                            "descripcion" => $descripcion,
                            "tiempoFuera" => $finActual - $inicioDia,
                            "sigtimestamp" => date("Y-m-d H:i:s", $finActual),
                            "nivel_tension" => $nivel_tension
                        ];

                        $inicioActual = $finActual + 1;
                    }
                } else {
                    // OPTIMIZACIÓN 13: Procesamiento optimizado de eventos en un solo día
                    $filtrados[] = [
                        "tag" => $tag,
                        "value" => $valorInicio,
                        "timestamp" => $inicioTimestamp,
                        "limiteInferior" => $limInf,
                        "limiteSuperior" => $limSup,
                        "cuenta" => $cuenta,
                        "nocuenta" => $nocuenta,
                        "descripcion" => $descripcion,
                        "tiempoFuera" => $tiempoTotal,
                        "sigtimestamp" => $sigtimestamp ?: date("Y-m-d H:i:s", $finUnix),
                        "nivel_tension" => $nivel_tension
                    ];
                }
            }
        }
    }

    // OPTIMIZACIÓN 14: Guardado optimizado
    file_put_contents("filtrados.json", json_encode($filtrados, JSON_PRETTY_PRINT));

    // Devolver los datos filtrados como JSON
    header('Content-Type: application/json');
    echo json_encode($filtrados);
}
?>