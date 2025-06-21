/**
 * Dashboard y Métricas ICV - ZOTGM
 * 
 * @author Emerson Salvador Plancarte Cerecedo
 * @version 2025
 * @description Sistema de dashboard con métricas, gráficas y visualización de datos ICV
 * 
 * Funcionalidades:
 * - Dashboard con métricas en tiempo real
 * - Gráficas interactivas con Chart.js
 * - Visualización de ICV por nivel de tensión
 * - Distribución de evaluaciones
 * - Filtros avanzados y estadísticas
 * - Actualización automática de datos
 */

// DASHBOARD Y GRÁFICAS PARA ICV
$(document).ready(function() {
    let chartNivelTension = null;
    let chartEvaluaciones = null;
    let chartTopNodos = null;
    let datosOriginales = [];

    // Toggle del dashboard
    $('#toggle-dashboard').click(function() {
        const dashboardVisible = $('#dashboard-metrics').is(':visible');
        
        if (!dashboardVisible) {
            $('#dashboard-metrics, #dashboard-charts, #filtros-avanzados').show();
            $(this).html('<i class="bi bi-eye-slash me-1"></i>Ocultar Dashboard');
            actualizarDashboard();
        } else {
            $('#dashboard-metrics, #dashboard-charts, #filtros-avanzados').hide();
            $(this).html('<i class="bi bi-graph-up me-1"></i>Dashboard');
        }
    });

    // Función para actualizar métricas del dashboard
    function actualizarDashboard() {
        const filas = $('#tabla-resultados tr');
        let totalInfracciones = 0;
        let infraccionesValidas = 0;
        let infraccionesJustificadas = 0;
        let tiempoTotalFuera = 0;
        let tiempoTotalEvaluado = 0;

        filas.each(function() {
            const $fila = $(this);
            const celdas = $fila.find('td');
            
            if (celdas.length >= 10) {
                totalInfracciones++;
                
                const cuenta = $fila.find('.cuenta-check').is(':checked');
                const nocuenta = $fila.find('.nocuenta-check').is(':checked');
                const tiempoFuera = $fila.find('td').eq(6).text();
                
                if (cuenta && !nocuenta) {
                    infraccionesValidas++;
                } else if (nocuenta) {
                    infraccionesJustificadas++;
                }

                if (tiempoFuera !== 'N/A' && tiempoFuera !== '') {
                    const tiempo = parseInt(tiempoFuera);
                    if (!isNaN(tiempo)) {
                        tiempoTotalFuera += tiempo;
                        if (cuenta && !nocuenta) {
                            tiempoTotalEvaluado += tiempo;
                        }
                    }
                }
            }
        });

        // Actualizar métricas
        $('#metric-total-infracciones').text(totalInfracciones);
        $('#metric-infracciones-validas').text(infraccionesValidas);
        $('#metric-infracciones-justificadas').text(infraccionesJustificadas);
        
        const icvPromedio = tiempoTotalEvaluado;
        $('#metric-icv-promedio').text(icvPromedio + ' seg');

        // Actualizar gráficas
        actualizarGraficas();
        actualizarFiltros();
    }

    // Función para actualizar gráficas
    function actualizarGraficas() {
        // Gráfica de Rendimiento por Nodo y Nivel de Tensión
        actualizarGraficaNivelTension();
        
        // Gráfica de Distribución de Evaluaciones
        actualizarGraficaEvaluaciones();
        
        // Gráfica de Top Nodos con Más Infracciones
        actualizarGraficaTopNodos();
    }

    // Gráfica de Rendimiento por Nivel de Tensión
    function actualizarGraficaNivelTension() {
        const ctx = document.getElementById('chartNivelTension').getContext('2d');
        
        // Destruir gráfica existente si existe
        if (chartNivelTension) {
            chartNivelTension.destroy();
        }

        // Calcular datos por nivel de tensión
        const datosPorNivel = {};
        const filas = $('#tabla-resultados tr');
        
        filas.each(function() {
            const $fila = $(this);
            const celdas = $fila.find('td');
            
            if (celdas.length >= 10) {
                const nivelTension = celdas.eq(2).text().trim();
                const tiempoFuera = celdas.eq(6).text();
                
                if (!datosPorNivel[nivelTension]) {
                    datosPorNivel[nivelTension] = { 
                        tiempoTotal: 0, 
                        infracciones: 0 
                    };
                }
                
                if (tiempoFuera !== 'N/A' && tiempoFuera !== '') {
                    const tiempo = parseInt(tiempoFuera);
                    if (!isNaN(tiempo)) {
                        datosPorNivel[nivelTension].tiempoTotal += tiempo;
                        datosPorNivel[nivelTension].infracciones++;
                    }
                }
            }
        });

        // Crear gráfica de barras simple
        const labels = [];
        const data = [];
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

        Object.keys(datosPorNivel).forEach((nivel, index) => {
            labels.push(`${nivel} KV`);
            data.push(datosPorNivel[nivel].tiempoTotal);
        });

        chartNivelTension = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tiempo Total de Infracciones (seg)',
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: colors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tiempo (segundos)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Tiempo: ' + context.parsed.y + ' seg';
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfica de Distribución de Evaluaciones
    function actualizarGraficaEvaluaciones() {
        const ctx = document.getElementById('chartEvaluaciones').getContext('2d');
        
        // Destruir gráfica existente si existe
        if (chartEvaluaciones) {
            chartEvaluaciones.destroy();
        }

        // Contar evaluaciones
        let cuenta = 0;
        let nocuenta = 0;
        let sinEvaluar = 0;
        
        $('#tabla-resultados tr').each(function() {
            const $fila = $(this);
            const celdas = $fila.find('td');
            
            if (celdas.length >= 10) {
                const cuentaCheck = $fila.find('.cuenta-check').is(':checked');
                const nocuentaCheck = $fila.find('.nocuenta-check').is(':checked');
                
                if (cuentaCheck && !nocuentaCheck) {
                    cuenta++;
                } else if (nocuentaCheck) {
                    nocuenta++;
                } else {
                    sinEvaluar++;
                }
            }
        });

        chartEvaluaciones = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cuenta', 'No cuenta', 'Sin evaluar'],
                datasets: [{
                    data: [cuenta, nocuenta, sinEvaluar],
                    backgroundColor: ['#28a745', '#ffc107', '#6c757d'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfica de Todos los Nodos con Infracciones
    function actualizarGraficaTopNodos() {
        const ctx = document.getElementById('chartTopNodos').getContext('2d');
        
        // Destruir gráfica existente si existe
        if (chartTopNodos) {
            chartTopNodos.destroy();
        }

        // Función para compactar nombres de nodos
        function compactarNombre(nodo) {
            // Extraer el nombre principal (antes del primer espacio múltiple)
            const nombrePrincipal = nodo.split(/\s{2,}/)[0];
            
            // Si es muy largo, acortarlo más
            if (nombrePrincipal.length > 15) {
                // Para nodos como "02GMOQMD B -01", mostrar solo "QMD B-01"
                const match = nombrePrincipal.match(/02GMO(.+)/);
                if (match) {
                    return match[1].replace(/\s+/g, '');
                }
                return nombrePrincipal.substring(0, 15) + '...';
            }
            
            return nombrePrincipal;
        }

        // Cargar datos de tags.json y combinar con datos de infracciones
        $.ajax({
            url: 'tags.json',
            method: 'GET',
            success: function(tagsData) {
                // Crear mapa de todos los nodos con datos iniciales
                const todosLosNodos = {};
                
                tagsData.forEach(tag => {
                    todosLosNodos[tag.tag] = {
                        nivelTension: tag.nivel_tension,
                        infracciones: 0,
                        nombreCompacto: compactarNombre(tag.tag)
                    };
                });

                // Contar infracciones de la tabla actual
                const filas = $('#tabla-resultados tr');
                filas.each(function() {
                    const $fila = $(this);
                    const celdas = $fila.find('td');
                    
                    if (celdas.length >= 10) {
                        const nodo = celdas.eq(1).text().trim();
                        const tiempoFuera = celdas.eq(6).text();
                        
                        if (todosLosNodos[nodo]) {
                            if (tiempoFuera !== 'N/A' && tiempoFuera !== '') {
                                const tiempo = parseInt(tiempoFuera);
                                if (!isNaN(tiempo)) {
                                    todosLosNodos[nodo].infracciones++;
                                }
                            }
                        }
                    }
                });

                // Ordenar nodos por número de infracciones (descendente)
                const nodosOrdenados = Object.keys(todosLosNodos)
                    .sort((a, b) => todosLosNodos[b].infracciones - todosLosNodos[a].infracciones);

                // Preparar datos para la gráfica
                const labels = nodosOrdenados.map(nodo => {
                    const datos = todosLosNodos[nodo];
                    return `${datos.nombreCompacto} (${datos.nivelTension}KV)`;
                });
                
                const data = nodosOrdenados.map(nodo => todosLosNodos[nodo].infracciones);

                // Colores basados en el nivel de tensión
                const coloresPorNivel = {
                    '400': '#FF6384',
                    '230': '#36A2EB', 
                    '115': '#FFCE56',
                    '69': '#4BC0C0'
                };

                const colors = nodosOrdenados.map(nodo => {
                    const nivel = todosLosNodos[nodo].nivelTension;
                    return coloresPorNivel[nivel] || '#9966FF';
                });

                chartTopNodos = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Número de Infracciones',
                            data: data,
                            backgroundColor: colors,
                            borderColor: colors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y', // Gráfica horizontal para mejor legibilidad
                        layout: {
                            padding: {
                                right: 20
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Número de Infracciones'
                                }
                            },
                            y: {
                                ticks: {
                                    maxRotation: 0,
                                    minRotation: 0,
                                    font: {
                                        size: 11
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    title: function(context) {
                                        // Mostrar el nombre completo en el tooltip
                                        const index = context[0].dataIndex;
                                        const nodoCompleto = nodosOrdenados[index];
                                        return nodoCompleto;
                                    },
                                    label: function(context) {
                                        return 'Infracciones: ' + context.parsed.x;
                                    }
                                }
                            }
                        }
                    }
                });
            },
            error: function() {
                console.error('No se pudo cargar tags.json');
            }
        });
    }

    // Función para actualizar filtros
    function actualizarFiltros() {
        // Actualizar filtro de nivel de tensión
        const niveles = new Set();
        $('#tabla-resultados tr').each(function() {
            const nivel = $(this).find('td').eq(2).text().trim();
            if (nivel) niveles.add(nivel);
        });
        
        const $filtroNivel = $('#filtro-nivel');
        $filtroNivel.find('option:not(:first)').remove();
        niveles.forEach(nivel => {
            $filtroNivel.append(`<option value="${nivel}">${nivel}</option>`);
        });
    }

    // Aplicar filtros
    $('#aplicar-filtros').click(function() {
        const filtroNivel = $('#filtro-nivel').val();
        const filtroEvaluacion = $('#filtro-evaluacion').val();
        const filtroNodo = $('#filtro-nodo').val().toLowerCase();

        $('#tabla-resultados tr').each(function() {
            const $fila = $(this);
            const celdas = $fila.find('td');
            
            if (celdas.length >= 10) {
                const nivel = celdas.eq(2).text().trim();
                const nodo = celdas.eq(1).text().toLowerCase();
                const cuenta = $fila.find('.cuenta-check').is(':checked');
                const nocuenta = $fila.find('.nocuenta-check').is(':checked');
                
                let evaluacion = '';
                if (cuenta && !nocuenta) evaluacion = 'cuenta';
                else if (nocuenta) evaluacion = 'nocuenta';
                else evaluacion = 'sin-evaluar';

                let mostrar = true;
                
                if (filtroNivel && nivel !== filtroNivel) mostrar = false;
                if (filtroEvaluacion && evaluacion !== filtroEvaluacion) mostrar = false;
                if (filtroNodo && !nodo.includes(filtroNodo)) mostrar = false;
                
                $fila.toggle(mostrar);
            }
        });
        
        actualizarIndices();
    });

    // Limpiar filtros
    $('#limpiar-filtros').click(function() {
        $('#filtro-nivel, #filtro-evaluacion').val('');
        $('#filtro-nodo').val('');
        $('#tabla-resultados tr').show();
        actualizarIndices();
    });

    // Actualizar dashboard cuando se cargan datos
    $(document).on('datosCargados', function() {
        if ($('#dashboard-metrics').is(':visible')) {
            actualizarDashboard();
        }
    });

    // Actualizar dashboard cuando se guardan evaluaciones
    $(document).on('evaluacionesGuardadas', function() {
        if ($('#dashboard-metrics').is(':visible')) {
            actualizarDashboard();
        }
    });
}); 