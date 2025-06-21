/**
 * Sistema de Paginación y Scroll Virtual - ICV ZOTGM
 * 
 * @author Emerson Salvador Plancarte Cerecedo
 * @version 2025
 * @description Sistema avanzado de paginación, búsqueda y optimización de rendimiento para tablas grandes
 * 
 * Características:
 * - Paginación inteligente con múltiples opciones de filas por página
 * - Búsqueda en tiempo real con debounce optimizado
 * - Ordenamiento avanzado por columnas
 * - Scroll virtual para mejor rendimiento
 * - Gestión eficiente de memoria
 * - Interfaz responsiva y accesible
 */

// SISTEMA DE PAGINACIÓN Y SCROLL VIRTUAL PARA TABLA ICV
class TablaPaginada {
    constructor() {
        this.datosOriginales = [];
        this.datosFiltrados = [];
        this.paginaActual = 1;
        this.filasPorPagina = 100;
        this.totalPaginas = 1;
        this.filtroBusqueda = '';
        this.ordenColumna = null;
        this.ordenAscendente = true;
        
        // Cache de elementos DOM
        this.$tabla = $('#tabla-resultados');
        this.$controles = $('#controles-tabla');
        this.$info = $('#info-resultados');
        this.$busqueda = $('#busqueda-tabla');
        this.$filasPorPagina = $('#filas-por-pagina');
        this.$paginaActual = $('#pagina-actual');
        this.$paginaInfo = $('#pagina-info');
        this.$totalPaginas = $('#total-paginas');
        this.$filasMostradas = $('#filas-mostradas');
        this.$totalFilas = $('#total-filas');
        
        this.inicializarEventos();
    }
    
    inicializarEventos() {
        // Evento de búsqueda con debounce
        let timeoutBusqueda;
        this.$busqueda.on('input', (e) => {
            clearTimeout(timeoutBusqueda);
            timeoutBusqueda = setTimeout(() => {
                this.filtroBusqueda = e.target.value.toLowerCase();
                this.aplicarFiltros();
            }, 300);
        });
        
        // Limpiar búsqueda
        $('#limpiar-busqueda').on('click', () => {
            this.$busqueda.val('');
            this.filtroBusqueda = '';
            this.aplicarFiltros();
        });
        
        // Cambiar filas por página
        this.$filasPorPagina.on('change', (e) => {
            this.filasPorPagina = parseInt(e.target.value);
            this.paginaActual = 1;
            this.actualizarPaginacion();
        });
        
        // Navegación de páginas
        $('#pagina-anterior').on('click', () => {
            if (this.paginaActual > 1) {
                this.paginaActual--;
                this.actualizarPaginacion();
            }
        });
        
        $('#pagina-siguiente').on('click', () => {
            if (this.paginaActual < this.totalPaginas) {
                this.paginaActual++;
                this.actualizarPaginacion();
            }
        });
        
        // Ordenamiento
        $('#tablagen').on('click', '.ordenar', (e) => {
            const columna = $(e.currentTarget).data('col');
            this.ordenarPorColumna(columna);
        });
    }
    
    cargarDatos(datos) {
        this.datosOriginales = datos;
        this.datosFiltrados = [...datos];
        this.paginaActual = 1;
        
        // Mostrar controles si hay datos
        if (datos.length > 0) {
            this.$controles.show();
            this.$info.show();
            this.actualizarPaginacion();
        } else {
            this.$controles.hide();
            this.$info.hide();
            this.mostrarMensajeVacio();
        }
    }
    
    aplicarFiltros() {
        if (!this.filtroBusqueda) {
            this.datosFiltrados = [...this.datosOriginales];
        } else {
            this.datosFiltrados = this.datosOriginales.filter(item => {
                return (
                    item.tag.toLowerCase().includes(this.filtroBusqueda) ||
                    item.nivel_tension.toLowerCase().includes(this.filtroBusqueda) ||
                    item.timestamp.toLowerCase().includes(this.filtroBusqueda) ||
                    item.sigtimestamp.toLowerCase().includes(this.filtroBusqueda) ||
                    item.value.toString().includes(this.filtroBusqueda) ||
                    (item.tiempoFuera && item.tiempoFuera.toString().includes(this.filtroBusqueda)) ||
                    item.limiteInferior.toString().includes(this.filtroBusqueda) ||
                    item.limiteSuperior.toString().includes(this.filtroBusqueda)
                );
            });
        }
        
        this.paginaActual = 1;
        this.actualizarPaginacion();
    }
    
    ordenarPorColumna(columna) {
        if (this.ordenColumna === columna) {
            this.ordenAscendente = !this.ordenAscendente;
        } else {
            this.ordenColumna = columna;
            this.ordenAscendente = true;
        }
        
        // Actualizar indicadores visuales
        $('.ordenar').removeClass('asc desc');
        $(`.ordenar[data-col="${columna}"]`).addClass(this.ordenAscendente ? 'asc' : 'desc');
        
        // Ordenar datos
        this.datosFiltrados.sort((a, b) => {
            let valorA, valorB;
            
            switch (columna) {
                case 1: // Nodo
                    valorA = a.tag;
                    valorB = b.tag;
                    break;
                case 2: // Nivel de tensión
                    valorA = a.nivel_tension;
                    valorB = b.nivel_tension;
                    break;
                case 3: // Hora de salida
                    valorA = new Date(a.timestamp);
                    valorB = new Date(b.timestamp);
                    break;
                case 5: // Valor
                    valorA = parseFloat(a.value);
                    valorB = parseFloat(b.value);
                    break;
                case 6: // Tiempo fuera
                    valorA = parseFloat(a.tiempoFuera || 0);
                    valorB = parseFloat(b.tiempoFuera || 0);
                    break;
                case 7: // Límite inferior
                    valorA = parseFloat(a.limiteInferior);
                    valorB = parseFloat(b.limiteInferior);
                    break;
                case 8: // Límite superior
                    valorA = parseFloat(a.limiteSuperior);
                    valorB = parseFloat(b.limiteSuperior);
                    break;
                default:
                    return 0;
            }
            
            if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
            if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
            return 0;
        });
        
        this.actualizarPaginacion();
    }
    
    actualizarPaginacion() {
        this.totalPaginas = Math.ceil(this.datosFiltrados.length / this.filasPorPagina);
        
        // Asegurar que la página actual sea válida
        if (this.paginaActual > this.totalPaginas) {
            this.paginaActual = this.totalPaginas || 1;
        }
        
        // Calcular índices de inicio y fin
        const inicio = (this.paginaActual - 1) * this.filasPorPagina;
        const fin = Math.min(inicio + this.filasPorPagina, this.datosFiltrados.length);
        const datosPagina = this.datosFiltrados.slice(inicio, fin);
        
        // Actualizar información
        this.$paginaActual.text(this.paginaActual);
        this.$paginaInfo.text(this.paginaActual);
        this.$totalPaginas.text(this.totalPaginas);
        this.$filasMostradas.text(datosPagina.length);
        this.$totalFilas.text(this.datosFiltrados.length);
        
        // Actualizar navegación
        $('#pagina-anterior').prop('disabled', this.paginaActual <= 1);
        $('#pagina-siguiente').prop('disabled', this.paginaActual >= this.totalPaginas);
        
        // Renderizar filas
        this.renderizarFilas(datosPagina, inicio);
    }
    
    renderizarFilas(datos, indiceInicio) {
        if (datos.length === 0) {
            this.mostrarMensajeVacio();
            return;
        }
        
        const htmlBuffer = [];
        
        datos.forEach((item, index) => {
            const indiceGlobal = indiceInicio + index;
            const cuentaChecked = item.cuenta ? 'checked' : '';
            const noCuentaChecked = item.nocuenta ? 'checked' : '';
            const descripcion = item.descripcion || '';
            const disabled = descripcion ? '' : 'disabled';
            const tiempoFuera = item.tiempoFuera || "0";
            
            htmlBuffer.push(`
<tr class="limits" data-index="${indiceGlobal}">
<td>${indiceGlobal + 1}</td>
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
            <input type="checkbox" name="nocuenta_${indiceGlobal}" class="form-check-input nocuenta-check me-2" ${noCuentaChecked}>
            <label for="nocuenta_${indiceGlobal}" class="form-check-label mb-0">No cuenta</label>
        </div>
        <div class="d-flex align-items-center">
            <input type="checkbox" name="cuenta_${indiceGlobal}" class="form-check-input cuenta-check me-2" ${cuentaChecked}>
            <label for="cuenta_${indiceGlobal}" class="form-check-label mb-0">Cuenta</label>
        </div>
    </div>
</td>
<td>
  <input type="text" name="descripcion_${indiceGlobal}" class="form-control descripcion-input" value="${descripcion}" ${disabled} required>
</td>
</tr>
            `);
        });
        
        this.$tabla.html(htmlBuffer.join(''));
        
        // Re-aplicar eventos de checkboxes
        this.aplicarEventosCheckboxes();
    }
    
    aplicarEventosCheckboxes() {
        this.$tabla.off('change', '.cuenta-check, .nocuenta-check');
        this.$tabla.on('change', '.cuenta-check, .nocuenta-check', function () {
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
    }
    
    mostrarMensajeVacio() {
        this.$tabla.html(`
            <tr>
                <td colspan="11" class="text-center mensaje-estado vacio">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${this.filtroBusqueda ? 'No se encontraron resultados para la búsqueda' : 'No hay datos disponibles'}
                </td>
            </tr>
        `);
    }
    
    obtenerDatosActuales() {
        return this.datosFiltrados;
    }
    
    obtenerDatosOriginales() {
        return this.datosOriginales;
    }
    
    // Método para obtener datos de la página actual para exportación
    obtenerDatosPaginaActual() {
        const inicio = (this.paginaActual - 1) * this.filasPorPagina;
        const fin = Math.min(inicio + this.filasPorPagina, this.datosFiltrados.length);
        return this.datosFiltrados.slice(inicio, fin);
    }
    
    // Método para limpiar filtros
    limpiarFiltros() {
        this.filtroBusqueda = '';
        this.$busqueda.val('');
        this.ordenColumna = null;
        this.ordenAscendente = true;
        $('.ordenar').removeClass('asc desc');
        this.aplicarFiltros();
    }
}

// Instancia global de la tabla paginada
let tablaPaginada;

// Inicialización cuando el DOM esté listo
$(document).ready(function() {
    tablaPaginada = new TablaPaginada();
}); 