/**
 * Sistema de Procesamiento de Datos ICV - ZOTGM
 * 
 * @author Emerson Salvador Plancarte Cerecedo
 * @version 2025
 * @description Manejo de datos, cálculos ICV, exportación y funcionalidades principales del sistema
 * 
 * Funcionalidades:
 * - Carga y procesamiento de datos de infracciones
 * - Cálculo automático de ICV por nivel de tensión
 * - Sistema de evaluación de infracciones (cuenta/no cuenta)
 * - Exportación avanzada a Excel y CSV
 * - Integración con sistema de paginación
 * - Dashboard con métricas en tiempo real
 */

$(document).ready(function () {
    // OPTIMIZACIÓN 1: Cache de elementos DOM
    const $tabla = $('#tabla-resultados');
    const $form = $('#form-fechas');
    const $timestamp = $('#timestamp');
    const $timestampReciente = $('#timestamp-reciente');
    const $resultadoPromedio = $('#resultado-promedio');

    // OPTIMIZACIÓN 2: Procesamiento optimizado de timestamps
    $.getJSON('eval.json', function (evalData) {
        let ultimoTimestamp = null;
        let nodoEvaluado = null;

        // Procesamiento optimizado de datos
        for (let equipo in evalData) {
            const registros = evalData[equipo];
            for (let timestamp in registros) {
                if (!ultimoTimestamp || new Date(timestamp) > new Date(ultimoTimestamp)) {
                    ultimoTimestamp = timestamp;
                    nodoEvaluado = equipo;
                }
            }
        }

        if (ultimoTimestamp) {
            const fecha = new Date(ultimoTimestamp);
            const opciones = {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            };
            const timestampFormateado = fecha.toLocaleString('es-ES', opciones);

            $timestamp.html(`
                <strong>Ultima infraccion evaluada en nodo:</strong> ${nodoEvaluado}
                <strong>del dia:</strong> ${timestampFormateado}
            `);
        } else {
            $timestampReciente.html('<strong>No se pudo cargar <strong>eval.json</strong>.</strong>');
        }
    }).fail(function () {
        $timestampReciente.html('<strong>No se pudo cargar <strong>eval.json</strong>.</strong>');
    });

    // OPTIMIZACIÓN 3: Evento de formulario optimizado con paginación
    $form.on('submit', function (e) {
        e.preventDefault();

        const fechaInicio = $('#fecha-inicial').val();
        const fechaFin = $('#fecha-final').val();

        if (!fechaInicio || !fechaFin || fechaInicio > fechaFin) {
            alert("La fecha inicial no puede ser mayor que la fecha final.");
            return false;
        }

        const modalElement = document.getElementById('loadingModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();

        $.ajax({
            url: 'procesar.php',
            method: 'POST',
            data: {
                fecha_inicial: fechaInicio,
                fecha_final: fechaFin
            },
            success: function (response) {
                if (response.length === 0) {
                    // Si no hay datos, ocultar controles y mostrar mensaje
                    $('#controles-tabla').hide();
                    $('#info-resultados').hide();
                    $tabla.html('<tr><td colspan="11" class="text-center mensaje-estado vacio">No se encontraron datos fuera de los limites</td></tr>');
                } else {
                    // OPTIMIZACIÓN 4: Ordenamiento optimizado
                    response.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    
                    // NUEVO: Usar sistema de paginación
                    if (typeof tablaPaginada !== 'undefined') {
                        tablaPaginada.cargarDatos(response);
                    } else {
                        // Fallback para cuando no está disponible la paginación
                        renderizarTablaCompleta(response);
                    }
                }
                
                // Disparar evento para actualizar dashboard
                $(document).trigger('datosCargados');
                
                setTimeout(() => {
                    modal.hide();
                }, 500);
            },
            error: function () {
                $tabla.html('<tr><td colspan="11" class="text-center text-danger">Error al procesar los datos</td></tr>');
                $('#controles-tabla').hide();
                $('#info-resultados').hide();
                modal.hide();
            }
        });
    });

    // Función de fallback para renderizar tabla completa (sin paginación)
    function renderizarTablaCompleta(response) {
        const htmlBuffer = [];

                    response.forEach(function (item, index) {
            const cuentaChecked = item.cuenta ? 'checked' : '';
            const noCuentaChecked = item.nocuenta ? 'checked' : '';
            const descripcion = item.descripcion || '';
            const disabled = descripcion ? '' : 'disabled';
                        const tiempoFuera = item.tiempoFuera || "0";

            htmlBuffer.push(`
<tr class="limits" data-index="${index}">
<td>${index + 1}</td>
<td>${item.tag}</td>
<td>${item.nivel_tension}</td>
<td style="background-color: yellow; color: red;">${item.timestamp}</td>
<td style="background-color: yellow; color: red;">${item.sigtimestamp}</td>
<td>${item.value}</td>
<td>${tiempoFuera || 'N/A'}</td>
<td>${item.limiteInferior}</td>
<td>${item.limiteSuperior}</td>
<td>
    <div class="d-flex flex-column">
        <div class="d-flex align-items-center">
            <input type="checkbox" name="nocuenta_${index}" class="form-check-input nocuenta-check me-2" ${noCuentaChecked}>
            <label for="nocuenta_${index}" class="form-check-label mb-0">No cuenta</label>
        </div>
        <div class="d-flex align-items-center">
            <input type="checkbox" name="cuenta_${index}" class="form-check-input cuenta-check me-2" ${cuentaChecked}>
            <label for="cuenta_${index}" class="form-check-label mb-0">Cuenta</label>
        </div>
    </div>
</td>
<td>
  <input type="text" name="descripcion_${index}" class="form-control descripcion-input" value="${descripcion}" ${disabled} required>
</td>
</tr>
                        `);
                    });

        $tabla.html(htmlBuffer.join(''));
                actualizarIndices();
    }

    // OPTIMIZACIÓN 7: Eventos optimizados con delegación (mantener para compatibilidad)
    $tabla.on('change', '.cuenta-check, .nocuenta-check', function () {
        const fila = $(this).closest('tr');
        const cuentaCheck = fila.find('.cuenta-check');
        const nocuentaCheck = fila.find('.nocuenta-check');
        const descInput = fila.find('.descripcion-input');

        if ($(this).hasClass('cuenta-check') && cuentaCheck.is(':checked')) {
            nocuentaCheck.prop('checked', false);
            descInput.prop('disabled', true).prop('required', false).val('');
        }
        if ($(this).hasClass('nocuenta-check') && nocuentaCheck.is(':checked')) {
            cuentaCheck.prop('checked', false);
            descInput.prop('disabled', false).prop('required', true);
        }
        if (!nocuentaCheck.is(':checked')) {
            descInput.prop('disabled', true).prop('required', false).val('');
        }
    });
});

// OPTIMIZACIÓN 8: Función de actualización optimizada
function actualizarIndices() {
    $('#tabla-resultados tr').each(function (i) {
        $(this).find('td').eq(0).text(i + 1);
    });
}

// Variables globales para controlar el orden de la tabla
let ordenAscendente = true;
let columnaOrdenActual = null;

// OPTIMIZACIÓN 9: Evento de ordenamiento optimizado
$('#tablagen').on('click', '.ordenar', function () {
    const columna = $(this).data('col');
    const filas = $('#tabla-resultados tr').get();

    if (columna === columnaOrdenActual) {
        ordenAscendente = !ordenAscendente;
    } else {
        ordenAscendente = true;
        columnaOrdenActual = columna;
    }

    // OPTIMIZACIÓN 10: Función de comparación optimizada
    filas.sort(function (a, b) {
        const celdaA = $(a).children('td').eq(columna).text().trim();
        const celdaB = $(b).children('td').eq(columna).text().trim();

        if (!isNaN(Date.parse(celdaA)) && !isNaN(Date.parse(celdaB))) {
            return ordenAscendente
                ? new Date(celdaA) - new Date(celdaB)
                : new Date(celdaB) - new Date(celdaA);
        }

        if (!isNaN(celdaA) && !isNaN(celdaB)) {
            return ordenAscendente
                ? parseFloat(celdaA) - parseFloat(celdaB)
                : parseFloat(celdaB) - parseFloat(celdaA);
        }

        return ordenAscendente
            ? celdaA.localeCompare(celdaB)
            : celdaB.localeCompare(celdaA);
    });

    $('#tabla-resultados').empty().append(filas);
    actualizarIndices();
});

// OPTIMIZACIÓN 11: Funciones de conversión optimizadas
function convertirAHoras(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${horas}h ${minutos}m ${segs}s`;
}

function convertirAHorasDecimal(segundos) {
    return (segundos / 3600).toFixed(2);
}

// OPTIMIZACIÓN 12: Procesamiento optimizado de evaluaciones
$('#guardar-evaluacion').click(function () {
    const evaluaciones = [];
    let valid = true;
    
    // NUEVO: Usar sistema de paginación si está disponible
    if (typeof tablaPaginada !== 'undefined' && tablaPaginada.obtenerDatosActuales().length > 0) {
        // Obtener datos del sistema de paginación
        const datosFiltrados = tablaPaginada.obtenerDatosActuales();
        
        datosFiltrados.forEach((item, index) => {
            // Obtener valores de checkboxes de la tabla actual
            const fila = $(`#tabla-resultados tr[data-index="${index}"]`);
            let cuenta = false;
            let nocuenta = false;
            let descripcion = '';
            
            if (fila.length > 0) {
                cuenta = fila.find('.cuenta-check').is(':checked');
                nocuenta = fila.find('.nocuenta-check').is(':checked');
                descripcion = fila.find('.descripcion-input').val();
            } else {
                // Si no está en la página actual, usar valores guardados
                cuenta = item.cuenta || false;
                nocuenta = item.nocuenta || false;
                descripcion = item.descripcion || '';
            }

            // Si está activado "No cuenta", la descripción es obligatoria
            if (nocuenta && (!descripcion || descripcion.trim() === '')) {
                if (fila.length > 0) {
                    fila.find('.descripcion-input').addClass('is-invalid');
                }
                valid = false;
            } else if (fila.length > 0) {
                fila.find('.descripcion-input').removeClass('is-invalid');
            }

            evaluaciones.push({
                tag: item.tag,
                timestamp: item.timestamp,
                cuenta: cuenta,
                nocuenta: nocuenta,
                descripcion: descripcion
            });
        });
    } else {
        // Fallback: procesar datos de la tabla DOM
        $('#tabla-resultados tr').each(function () {
            const index = $(this).data('index');
            if (index !== undefined) {
                const tag = $(this).find('td').eq(1).text();
                const timestamp = $(this).find('td').eq(3).text();
                const cuenta = $(this).find('.cuenta-check').is(':checked');
                const nocuenta = $(this).find('.nocuenta-check').is(':checked');
                const descripcion = $(this).find('.descripcion-input').val();

                // Si está activado "No cuenta", la descripción es obligatoria
                if (nocuenta && (!descripcion || descripcion.trim() === '')) {
                    $(this).find('.descripcion-input').addClass('is-invalid');
                    valid = false;
                } else {
                    $(this).find('.descripcion-input').removeClass('is-invalid');
                }

                evaluaciones.push({
                    tag: tag,
                    timestamp: timestamp,
                    cuenta: cuenta,
                    nocuenta: nocuenta,
                    descripcion: descripcion
                });
            }
        });
    }

    if (!valid) {
        alert('Debe introducir una justificación en todos los campos donde "No cuenta" esté activado.');
        return;
    }

    $.ajax({
        url: 'procesar.php',
        method: 'POST',
        data: {
            evaluaciones: JSON.stringify(evaluaciones)
        },
        success: function (response) {
            // Verificar si la respuesta es un string JSON o ya es un objeto
            let result;
            if (typeof response === 'string') {
                try {
                    result = JSON.parse(response);
                } catch (e) {
                    result = { success: false, message: 'Error al procesar respuesta' };
                }
            } else {
                result = response;
            }

            if (result.success) {
                alert('Evaluaciones guardadas correctamente');
                // Actualizar datos en el sistema de paginación
                if (typeof tablaPaginada !== 'undefined') {
                    tablaPaginada.actualizarPaginacion();
                }
                // Disparar evento para actualizar dashboard
                $(document).trigger('evaluacionesGuardadas');
            } else {
                alert('Error al guardar evaluaciones: ' + (result.message || 'Error desconocido'));
            }
        },
        error: function (xhr, status, error) {
            console.error('Error AJAX:', status, error);
            alert('Error de conexión al guardar evaluaciones');
        }
    });
});

// OPTIMIZACIÓN 13: Cálculo de ICV optimizado con paginación
$('#calcular-promedio').click(function () {
    let sumaPorNivel = {};
    let sumaTotal = 0;
    let totalTagsGlobal = 0;

    // NUEVO: Usar sistema de paginación si está disponible
    if (typeof tablaPaginada !== 'undefined' && tablaPaginada.obtenerDatosActuales().length > 0) {
        const datosFiltrados = tablaPaginada.obtenerDatosActuales();
        
        datosFiltrados.forEach((item, index) => {
            // Obtener valores de checkboxes de la tabla actual
            const fila = $(`#tabla-resultados tr[data-index="${index}"]`);
            let cuenta = false;
            let nocuenta = false;
            
            if (fila.length > 0) {
                cuenta = fila.find('.cuenta-check').is(':checked');
                nocuenta = fila.find('.nocuenta-check').is(':checked');
            } else {
                // Si no está en la página actual, usar valores guardados
                cuenta = item.cuenta || false;
                nocuenta = item.nocuenta || false;
            }

            // CORRECCIÓN: Solo considerar las filas marcadas como 'cuenta' y que NO estén marcadas como 'nocuenta'
            const esCuenta = cuenta && !nocuenta;

            if (esCuenta) {
                const nivel_tension = item.nivel_tension;
                const tiempoTexto = (item.tiempoFuera || "0").toString().split(' ')[0];
                const tiempoSegundos = parseFloat(tiempoTexto) || 0;

                if (!sumaPorNivel[nivel_tension]) sumaPorNivel[nivel_tension] = 0;
                sumaPorNivel[nivel_tension] += tiempoSegundos;
                sumaTotal += tiempoSegundos;
            }
        });
    } else {
        // Fallback: procesar datos de la tabla DOM
    $('#tabla-resultados tr').each(function () {
        const fila = $(this);
            const esCuenta = fila.find('.cuenta-check').is(':checked') && !fila.find('.nocuenta-check').is(':checked');

        if (esCuenta) {
                const nivel_tension = fila.find('td').eq(2).text().trim();
                const tiempoTexto = fila.find('td').eq(6).text().split(' ')[0];
                const tiempoSegundos = parseFloat(tiempoTexto) || 0;

            if (!sumaPorNivel[nivel_tension]) sumaPorNivel[nivel_tension] = 0;
            sumaPorNivel[nivel_tension] += tiempoSegundos;
                sumaTotal += tiempoSegundos;
        }
    });
    }

    // Cargar el archivo 'tags.json' que contiene los datos de todos los nodos
    $.getJSON('tags.json', function (tagsData) {
        const conteoTagsPorNivel = {};

        totalTagsGlobal = tagsData.length;

        // Contar cuantos nodos pertenecen a cada nivel de tensión
        tagsData.forEach(tag => {
            const nivel = tag.nivel_tension;
            if (!conteoTagsPorNivel[nivel]) conteoTagsPorNivel[nivel] = 0;
            conteoTagsPorNivel[nivel]++;
        });

        // Calcular el promedio global dividiendo la suma total entre el total de tags
        const promedioGlobal = sumaTotal / (totalTagsGlobal || 1);

        // Función para convertir segundos en formato h:m:s
        function convertirAHoras(segundos) {
            const horas = Math.floor(segundos / 3600);
            const minutos = Math.floor((segundos % 3600) / 60);
            const segundosRestantes = Math.floor(segundos % 60);
            return `${horas}h ${minutos}m ${segundosRestantes}s`;
        }

        // Función para convertir segundos en formato decimal de horas
        function convertirAHorasDecimal(segundos) {
            return (segundos / 3600).toFixed(9);
        }

        // Crear el HTML para mostrar los resultados por nivel de tensión
        let html = `
        <div class="card mb-4">
            <div class="card-header text-success fw-bold">
                ICV por Nivel de Tensión
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead class="thead-dark">
                            <tr>
                                <th>Nivel de Tensión</th>
                                <th>ICV (h:m:s)</th>
                                <th>ICV (Decimal)</th>
                                <th>ICV (Segundos)</th>
                                <th>Suma de Tiempos (h:m:s)</th>
                                <th>Suma de Tiempos (Decimal)</th>
                                <th>Suma de Tiempos (Segundos)</th>
                                <th>Nodos</th>
                            </tr>
                        </thead>
                        <tbody>`;

        // Recorrer los niveles de tensión encontrados y generar las filas
        for (const nivel in sumaPorNivel) {
            const suma = sumaPorNivel[nivel];
            const totalTags = conteoTagsPorNivel[nivel] || 1;
            const promedio = suma / totalTags;

            html += `<tr>
                        <td><strong>${nivel}</strong></td>
                        <td class="text-center">${convertirAHoras(promedio)}</td>
                        <td class="text-center">${convertirAHorasDecimal(promedio)}</td>
                        <td class="text-center">${promedio}</td>
                        <td class="text-center">${convertirAHoras(suma)}</td>
                        <td class="text-center">${convertirAHorasDecimal(suma)}</td>
                        <td class="text-center">${suma}</td>
                        <td class="text-center">${totalTags}</td>
                    </tr>`;
        }

        // Cerrar tabla y tarjeta
        html += `</tbody></table>
                </div>
            </div>
        </div>`;

        // Crear el HTML para mostrar el promedio global
        html += `
        <div class="card">
            <div class="card-header text-primary fw-bold">
                ICV Global
            </div>
            <div class="card-body">
                <p><strong>ICV (h:m:s):</strong> ${convertirAHoras(promedioGlobal)}</p>
                <p><strong>ICV (Decimal):</strong> ${convertirAHorasDecimal(promedioGlobal)}</p>                
                <p><strong>ICV (Segundos):</strong> ${promedioGlobal}</p>
                <p><strong>Suma Total de Tiempos (h:m:s):</strong> ${convertirAHoras(sumaTotal)}</p>
                <p><strong>Suma Total de Tiempos (Decimal):</strong> ${convertirAHorasDecimal(sumaTotal)}</p>
                <p><strong>Suma Total de Tiempos (Segundos):</strong> ${sumaTotal}</p>
                <p><strong>Total de Nodos Evaluados:</strong> ${totalTagsGlobal}</p>
            </div>
        </div>`;

        // Insertar el contenido generado dentro del div con ID 'resultado-promedio'
        $('#resultado-promedio').html(html);

    }).fail(function () {
        $('#resultado-promedio').html('<span class="text-danger">No se pudo cargar <strong>tags.json</strong> para calcular los promedios.</span>');
    });
});

// NUEVA FUNCIÓN DE EXPORTACIÓN DE EXCEL COMPLETAMENTE REDISEÑADA
$('#exportar-xls').click(function () {
    exportarDatos('excel');
});

// NUEVA FUNCIÓN DE EXPORTACIÓN CSV
$('#exportar-csv').click(function () {
    exportarDatos('csv');
});

// FUNCIÓN UNIFICADA DE EXPORTACIÓN
function exportarDatos(formato) {
    // NUEVO: Usar sistema de paginación si está disponible
    let datosParaExportar = [];
    let totalInfracciones = 0;
    let tiempoTotalFuera = 0;
    let tiempoTotalEvaluado = 0;
    let infraccionesPorNivel = {};
    let nodosUnicos = new Set();

    if (typeof tablaPaginada !== 'undefined' && tablaPaginada.obtenerDatosActuales().length > 0) {
        // Usar datos del sistema de paginación (todos los datos filtrados)
        const datosFiltrados = tablaPaginada.obtenerDatosActuales();
        
        if (datosFiltrados.length === 0) {
            alert('No hay datos para exportar. Por favor, cargue datos primero.');
            return;
        }

        // Procesar datos del sistema de paginación
        datosFiltrados.forEach((item, index) => {
            totalInfracciones++;
            
            // Extraer datos del objeto
            const numeroInfraccion = index + 1;
            const nodo = item.tag;
            const nivelTension = item.nivel_tension;
            const horaSalida = item.timestamp;
            const horaEntrada = item.sigtimestamp;
            const valor = item.value;
            const tiempoFueraSeg = item.tiempoFuera || "0";
            const limiteInferior = item.limiteInferior;
            const limiteSuperior = item.limiteSuperior;
            
            // Obtener estado de evaluación
            const cuentaCheck = item.cuenta || false;
            const nocuentaCheck = item.nocuenta || false;
            let descripcion = item.descripcion || '';
            
            // CORRECCIÓN: Lógica corregida para mostrar evaluaciones correctamente
            let evaluacion = '';
            if (nocuentaCheck) evaluacion = 'No cuenta';
            else if (cuentaCheck) evaluacion = 'Cuenta';
            else evaluacion = 'Sin evaluar';

            // Si está marcado "Cuenta", agregar mensaje automático a la justificación
            if (cuentaCheck && !nocuentaCheck) {
                if (descripcion) {
                    descripcion = `Infracción válida - ${descripcion}`;
                } else {
                    descripcion = 'Infracción válida';
                }
            }

            // Convertir tiempo a formato legible
            let tiempoFormateado = 'N/A';
            if (tiempoFueraSeg !== 'N/A' && tiempoFueraSeg !== '' && tiempoFueraSeg !== '0') {
                const tiempo = parseInt(tiempoFueraSeg);
                if (!isNaN(tiempo)) {
                    tiempoFormateado = convertirAHoras(tiempo);
                    tiempoTotalFuera += tiempo;
                    // CORRECCIÓN: Solo se cuenta para ICV si está marcado "Cuenta" (no está marcado "No cuenta")
                    if (cuentaCheck && !nocuentaCheck) {
                        tiempoTotalEvaluado += tiempo;
                    }
                }
            }

            // Acumular estadísticas por nivel de tensión
            if (!infraccionesPorNivel[nivelTension]) {
                infraccionesPorNivel[nivelTension] = {
                    count: 0,
                    tiempoTotal: 0,
                    tiempoEvaluado: 0
                };
            }
            infraccionesPorNivel[nivelTension].count++;
            if (tiempoFueraSeg !== 'N/A' && tiempoFueraSeg !== '' && tiempoFueraSeg !== '0') {
                const tiempo = parseInt(tiempoFueraSeg);
                if (!isNaN(tiempo)) {
                    infraccionesPorNivel[nivelTension].tiempoTotal += tiempo;
                    // CORRECCIÓN: Solo se cuenta para ICV si está marcado "Cuenta" (no está marcado "No cuenta")
                    if (cuentaCheck && !nocuentaCheck) {
                        infraccionesPorNivel[nivelTension].tiempoEvaluado += tiempo;
                    }
                }
            }

            nodosUnicos.add(nodo);

            // Agregar datos para exportación
            datosParaExportar.push({
                numeroInfraccion,
                nodo,
                nivelTension,
                horaSalida,
                horaEntrada,
                valor,
                tiempoFueraSeg,
                tiempoFormateado,
                limiteInferior,
                limiteSuperior,
                evaluacion,
                descripcion
            });
        });
    } else {
        // Fallback: procesar datos de la tabla DOM (método anterior)
        const filas = $('#tabla-resultados tr');
        if (filas.length === 0 || filas.first().find('td').length === 1) {
            alert('No hay datos para exportar. Por favor, cargue datos primero.');
            return;
        }

        // Procesar cada fila de datos
        filas.each(function (index) {
            const $fila = $(this);
            const celdas = $fila.find('td');
            
            // Verificar que sea una fila de datos válida (no mensaje de error)
            if (celdas.length < 10) return;

            totalInfracciones++;
            
            // Extraer datos de las celdas
            const numeroInfraccion = celdas.eq(0).text().trim();
            const nodo = celdas.eq(1).text().trim();
            const nivelTension = celdas.eq(2).text().trim();
            const horaSalida = celdas.eq(3).text().trim();
            const horaEntrada = celdas.eq(4).text().trim();
            const valor = celdas.eq(5).text().trim();
            const tiempoFueraSeg = celdas.eq(6).text().trim();
            const limiteInferior = celdas.eq(7).text().trim();
            const limiteSuperior = celdas.eq(8).text().trim();
            
            // Obtener estado de evaluación
            const cuentaCheck = $fila.find('.cuenta-check').is(':checked');
            const nocuentaCheck = $fila.find('.nocuenta-check').is(':checked');
            let descripcion = $fila.find('.descripcion-input').val().trim();
            
            // CORRECCIÓN: Lógica corregida para mostrar evaluaciones correctamente
            let evaluacion = '';
            if (nocuentaCheck) evaluacion = 'No cuenta';
            else if (cuentaCheck) evaluacion = 'Cuenta';
            else evaluacion = 'Sin evaluar';

            // Si está marcado "Cuenta", agregar mensaje automático a la justificación
            if (cuentaCheck && !nocuentaCheck) {
                if (descripcion) {
                    descripcion = `Infracción válida - ${descripcion}`;
                } else {
                    descripcion = 'Infracción válida';
                }
            }

            // Convertir tiempo a formato legible
            let tiempoFormateado = 'N/A';
            if (tiempoFueraSeg !== 'N/A' && tiempoFueraSeg !== '') {
                const tiempo = parseInt(tiempoFueraSeg);
                if (!isNaN(tiempo)) {
                    tiempoFormateado = convertirAHoras(tiempo);
                    tiempoTotalFuera += tiempo;
                    // CORRECCIÓN: Solo se cuenta para ICV si está marcado "Cuenta" (no está marcado "No cuenta")
                    if (cuentaCheck && !nocuentaCheck) {
                        tiempoTotalEvaluado += tiempo;
                    }
                }
            }

            // Acumular estadísticas por nivel de tensión
            if (!infraccionesPorNivel[nivelTension]) {
                infraccionesPorNivel[nivelTension] = {
                    count: 0,
                    tiempoTotal: 0,
                    tiempoEvaluado: 0
                };
            }
            infraccionesPorNivel[nivelTension].count++;
            if (tiempoFueraSeg !== 'N/A' && tiempoFueraSeg !== '') {
                const tiempo = parseInt(tiempoFueraSeg);
                if (!isNaN(tiempo)) {
                    infraccionesPorNivel[nivelTension].tiempoTotal += tiempo;
                    // CORRECCIÓN: Solo se cuenta para ICV si está marcado "Cuenta" (no está marcado "No cuenta")
                    if (cuentaCheck && !nocuentaCheck) {
                        infraccionesPorNivel[nivelTension].tiempoEvaluado += tiempo;
                    }
                }
            }

            nodosUnicos.add(nodo);

            // Agregar datos para exportación
            datosParaExportar.push({
                numeroInfraccion,
                nodo,
                nivelTension,
                horaSalida,
                horaEntrada,
                valor,
                tiempoFueraSeg,
                tiempoFormateado,
                limiteInferior,
                limiteSuperior,
                evaluacion,
                descripcion
            });
        });
    }

    if (formato === 'excel') {
        exportarExcel(datosParaExportar, totalInfracciones, tiempoTotalFuera, tiempoTotalEvaluado, infraccionesPorNivel, nodosUnicos);
    } else if (formato === 'csv') {
        exportarCSV(datosParaExportar, totalInfracciones, tiempoTotalFuera, tiempoTotalEvaluado, infraccionesPorNivel, nodosUnicos);
    }
}

// FUNCIÓN PARA EXPORTAR A EXCEL
function exportarExcel(datosExportar, totalInfracciones, tiempoTotalFuera, tiempoTotalEvaluado, infraccionesPorNivel, nodosUnicos) {
    // Calcular estadísticas por nivel de tensión para ICV
    let sumaPorNivel = {};
    let sumaTotal = 0;
    
    // Procesar datos para ICV
    $('#tabla-resultados tr').each(function () {
        const fila = $(this);
        const esCuenta = fila.find('.cuenta-check').is(':checked') && !fila.find('.nocuenta-check').is(':checked');

        if (esCuenta) {
            const nivel_tension = fila.find('td').eq(2).text().trim();
            const tiempoTexto = fila.find('td').eq(6).text().split(' ')[0];
            const tiempoSegundos = parseFloat(tiempoTexto) || 0;

            if (!sumaPorNivel[nivel_tension]) sumaPorNivel[nivel_tension] = 0;
            sumaPorNivel[nivel_tension] += tiempoSegundos;
            sumaTotal += tiempoSegundos;
        }
    });

    // Crear el contenido HTML para Excel
    let excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="UTF-8">
        <style>
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header-row { background-color: #4CAF50; color: white; }
            .data-row:nth-child(even) { background-color: #f9f9f9; }
            .warning-cell { background-color: #FFEB3B; color: #D32F2F; }
            .evaluacion-cell { text-align: left; }
            .section-header { background-color: #2196F3; color: white; font-weight: bold; font-size: 14px; }
            .icv-table { background-color: #E8F5E8; }
            .icv-header { background-color: #4CAF50; color: white; }
            .global-table { background-color: #E3F2FD; }
            .global-header { background-color: #2196F3; color: white; }
        </style>
    </head>
    <body>
        <h2 style="text-align: center; color: #333;">Reporte de Índice de Calidad de Voltaje (ICV)</h2>
        
        <!-- Tabla de Infracciones Detalladas -->
        <h3 style="color: #333;">Infracciones Detalladas</h3>
        <table>
            <tr class="header-row">
                <th>No. de Infracción</th>
                <th>Nodo</th>
                <th>Nivel de Tensión</th>
                <th>Hora de Salida</th>
                <th>Hora de Entrada</th>
                <th>Valor</th>
                <th>Tiempo Fuera (seg)</th>
                <th>Tiempo Fuera (h:m:s)</th>
                <th>Límite Inferior</th>
                <th>Límite Superior</th>
                <th>Evaluación</th>
                <th>Justificación</th>
            </tr>`;

    // Agregar filas de datos
    datosExportar.forEach(dato => {
        excelContent += `
            <tr class="data-row">
                <td>${dato.numeroInfraccion}</td>
                <td>${dato.nodo}</td>
                <td>${dato.nivelTension}</td>
                <td class="warning-cell">${dato.horaSalida}</td>
                <td class="warning-cell">${dato.horaEntrada}</td>
                <td>${dato.valor}</td>
                <td>${dato.tiempoFueraSeg}</td>
                <td>${dato.tiempoFormateado}</td>
                <td>${dato.limiteInferior}</td>
                <td>${dato.limiteSuperior}</td>
                <td>${dato.evaluacion}</td>
                <td class="evaluacion-cell">${dato.descripcion}</td>
            </tr>`;
    });

    
    excelContent += `</table>`;

    // Agregar tabla de ICV por Nivel de Tensión
    excelContent += `
        <h3 style="color: #333;">ICV por Nivel de Tensión</h3>
        <table class="icv-table">
            <tr class="icv-header">
                <th>Nivel de Tensión</th>
                <th>ICV (h:m:s)</th>
                <th>ICV (Decimal)</th>
                <th>ICV (Segundos)</th>
                <th>Suma de Tiempos (h:m:s)</th>
                <th>Suma de Tiempos (Decimal)</th>
                <th>Suma de Tiempos (Segundos)</th>
                <th>Nodos</th>
            </tr>`;

    // Cargar datos de tags.json para obtener el conteo de nodos por nivel
    $.ajax({
        url: 'tags.json',
        method: 'GET',
        async: false,
        success: function(tagsData) {
            const conteoTagsPorNivel = {};
            const totalTagsGlobal = tagsData.length;

            // Contar nodos por nivel de tensión
        tagsData.forEach(tag => {
            const nivel = tag.nivel_tension;
            if (!conteoTagsPorNivel[nivel]) conteoTagsPorNivel[nivel] = 0;
            conteoTagsPorNivel[nivel]++;
        });

            // Generar filas para cada nivel de tensión
            for (const nivel in sumaPorNivel) {
                const suma = sumaPorNivel[nivel];
                const totalTags = conteoTagsPorNivel[nivel] || 1;
                const promedio = suma / totalTags;

                excelContent += `
                    <tr>
                        <td><strong>${nivel}</strong></td>
                        <td>${convertirAHoras(promedio)}</td>
                        <td>${(promedio / 3600).toFixed(9)}</td>
                        <td>${promedio}</td>
                        <td>${convertirAHoras(suma)}</td>
                        <td>${(suma / 3600).toFixed(9)}</td>
                        <td>${suma}</td>
                        <td>${totalTags}</td>
                    </tr>`;
            }

            // Agregar tabla de ICV Global
            const promedioGlobal = sumaTotal / (totalTagsGlobal || 1);
            
            excelContent += `</table>
            
            <h3 style="color: #333;">ICV Global</h3>
            <table class="global-table">
                <tr class="global-header">
                    <th colspan="2">Resumen Global</th>
                </tr>
                <tr>
                    <td><strong>ICV (h:m:s):</strong></td>
                    <td>${convertirAHoras(promedioGlobal)}</td>
                </tr>
                <tr>
                    <td><strong>ICV (Decimal):</strong></td>
                    <td>${(promedioGlobal / 3600).toFixed(9)}</td>
                </tr>
                <tr>
                    <td><strong>ICV (Segundos):</strong></td>
                    <td>${promedioGlobal}</td>
                </tr>
                <tr>
                    <td><strong>Suma Total de Tiempos (h:m:s):</strong></td>
                    <td>${convertirAHoras(sumaTotal)}</td>
                </tr>
                <tr>
                    <td><strong>Suma Total de Tiempos (Decimal):</strong></td>
                    <td>${(sumaTotal / 3600).toFixed(9)}</td>
                </tr>
                <tr>
                    <td><strong>Suma Total de Tiempos (Segundos):</strong></td>
                    <td>${sumaTotal}</td>
                </tr>
                <tr>
                    <td><strong>Total de Nodos Evaluados:</strong></td>
                    <td>${totalTagsGlobal}</td>
                </tr>
            </table>`;
        },
        error: function() {
            excelContent += `</table>
            <p style="color: red;">No se pudo cargar tags.json para calcular los promedios por nivel de tensión.</p>`;
        }
    });

    // Agregar información del reporte
    const fechaActual = new Date().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    excelContent += `
        <br>
        <table style="width: 50%; border: none;">
            <tr style="border: none;">
                <td style="border: none; font-weight: bold;">Información del Reporte:</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none;">Fecha de generación: ${fechaActual}</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none;">Total de infracciones: ${totalInfracciones}</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none;">Nodos únicos: ${nodosUnicos.size}</td>
            </tr>
            <tr style="border: none;">
                <td style="border: none;">Niveles de tensión: ${Object.keys(infraccionesPorNivel).length}</td>
            </tr>
        </table>
    </body>
    </html>`;

    // Generar nombre de archivo con fecha
    const fechaArchivo = new Date().toLocaleDateString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');

    const nombreArchivo = `Reporte_ICV_${fechaArchivo}.xls`;

    // Crear y descargar el archivo
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Mostrar mensaje de éxito
    alert(`Reporte Excel exportado exitosamente:\n- ${totalInfracciones} infracciones procesadas\n- ${nodosUnicos.size} nodos únicos\n- ${Object.keys(infraccionesPorNivel).length} niveles de tensión\n- Incluye ICV por nivel de tensión y global\n\nArchivo: ${nombreArchivo}`);
}

// FUNCIÓN PARA EXPORTAR A CSV
function exportarCSV(datosExportar, totalInfracciones, tiempoTotalFuera, tiempoTotalEvaluado, infraccionesPorNivel, nodosUnicos) {
    // Crear encabezados CSV
    let csvContent = [
        'No. de Infracción',
        'Nodo',
        'Nivel de Tensión',
        'Hora de Salida',
        'Hora de Entrada',
        'Valor',
        'Tiempo Fuera (seg)',
        'Tiempo Fuera (h:m:s)',
        'Límite Inferior',
        'Límite Superior',
        'Evaluación',
        'Justificación'
    ].join(',');

    // Agregar datos
    datosExportar.forEach(dato => {
        const fila = [
            dato.numeroInfraccion,
            `"${dato.nodo}"`,
            dato.nivelTension,
            dato.horaSalida,
            dato.horaEntrada,
            dato.valor,
            dato.tiempoFueraSeg,
            dato.tiempoFormateado,
            dato.limiteInferior,
            dato.limiteSuperior,
            dato.evaluacion,
            `"${dato.descripcion}"`
        ].join(',');
        csvContent += '\n' + fila;
    });

    // Agregar línea de totales
    if (totalInfracciones > 0) {
        const tiempoTotalFormateado = convertirAHoras(tiempoTotalFuera);
        const tiempoEvaluadoFormateado = convertirAHoras(tiempoTotalEvaluado);
        const icvPorcentaje = tiempoTotalFuera > 0 ? ((tiempoTotalEvaluado / tiempoTotalFuera) * 100).toFixed(2) : '0.00';

        csvContent += '\n' + [
            'TOTALES',
            '',
            '',
            '',
            '',
            '',
            tiempoTotalFuera,
            tiempoTotalFormateado,
            `ICV: ${icvPorcentaje}%`,
            '',
            `Tiempo Evaluado: ${tiempoEvaluadoFormateado}`,
            ''
        ].join(',');
    }

    // Agregar estadísticas por nivel
    for (let nivel in infraccionesPorNivel) {
        const stats = infraccionesPorNivel[nivel];
        const tiempoFormateado = convertirAHoras(stats.tiempoTotal);
        const tiempoEvaluadoFormateado = convertirAHoras(stats.tiempoEvaluado);
        const icvNivel = stats.tiempoTotal > 0 ? ((stats.tiempoEvaluado / stats.tiempoTotal) * 100).toFixed(2) : '0.00';

        csvContent += '\n' + [
            `NIVEL ${nivel} - ${stats.count} infracciones`,
            '',
            '',
            '',
            '',
            '',
            stats.tiempoTotal,
            tiempoFormateado,
            `ICV: ${icvNivel}%`,
            '',
            `Evaluado: ${tiempoEvaluadoFormateado}`,
            ''
        ].join(',');
    }

    // Agregar información del reporte
    const fechaActual = new Date().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    csvContent += '\n\nInformación del Reporte:';
    csvContent += `\nFecha de generación,${fechaActual}`;
    csvContent += `\nTotal de infracciones,${totalInfracciones}`;
    csvContent += `\nNodos únicos,${nodosUnicos.size}`;
    csvContent += `\nNiveles de tensión,${Object.keys(infraccionesPorNivel).length}`;

    // Generar nombre de archivo con fecha
    const fechaArchivo = new Date().toLocaleDateString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');

    const nombreArchivo = `Reporte_ICV_${fechaArchivo}.csv`;

    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Mostrar mensaje de éxito
    alert(`Reporte CSV exportado exitosamente:\n- ${totalInfracciones} infracciones procesadas\n- ${nodosUnicos.size} nodos únicos\n- ${Object.keys(infraccionesPorNivel).length} niveles de tensión\n\nArchivo: ${nombreArchivo}`);
}