# Sistema de Índice de Calidad de Voltaje (ICV) - ZOTGM

## 📋 Descripción

Sistema de monitoreo y evaluación de calidad de voltaje para la Zona de Operación de Transmisión Guerrero Morelos (ZOTGM). Este sistema permite el análisis de infracciones de voltaje, cálculo automático del Índice de Calidad de Voltaje (ICV) y gestión de evaluaciones de infracciones.

## 🚀 Características Principales

- **Monitoreo en tiempo real** de parámetros de voltaje
- **Evaluación automática** de infracciones de voltaje
- **Cálculo de ICV** por nivel de tensión y global
- **Sistema de paginación** optimizado para grandes volúmenes de datos
- **Dashboard interactivo** con métricas y gráficas
- **Exportación de datos** a Excel y CSV
- **Sistema de autenticación** para administradores
- **Gestión de evaluaciones** de infracciones

## 🛠️ Tecnologías Utilizadas

- **Backend:** PHP 7.4+
- **Frontend:** HTML5, CSS3, JavaScript (jQuery)
- **Gráficas:** Chart.js
- **Base de datos:** Archivos JSON
- **Servidor:** Apache (XAMPP)

## 📁 Estructura del Proyecto

```
ICV/
├── index.php              # Página principal del sistema
├── procesar.php           # Backend para procesamiento de datos
├── auth.php               # Sistema de autenticación
├── tagadmin.php           # Administración de tags
├── dashboard.js           # Dashboard y gráficas
├── dataproc.js            # Procesamiento de datos frontend
├── paginacion.js          # Sistema de paginación
├── autenticacion.js       # Autenticación frontend
├── estilo.css             # Estilos del sistema
├── tags.json              # Configuración de tags y límites
├── eval.json              # Evaluaciones guardadas
├── ICVDatalink.exe        # Programa de extracción de datos
└── README.md              # Este archivo
```

## 🎯 Funcionalidades

### Dashboard y Métricas
- Métricas en tiempo real de infracciones
- Gráficas de rendimiento por nivel de tensión
- Distribución de evaluaciones
- Top nodos con más infracciones

### Procesamiento de Datos
- Extracción automática de datos con ICVDatalink.exe
- Filtrado de infracciones fuera de límites
- Cálculo automático de tiempos de infracción
- Optimización de memoria para grandes volúmenes

### Sistema de Evaluaciones
- Marcado de infracciones como "Cuenta" o "No cuenta"
- Justificaciones personalizadas
- Guardado automático de evaluaciones
- Historial de evaluaciones por timestamp

### Exportación
- Exportación a Excel con formato profesional
- Exportación a CSV para análisis externos
- Reportes detallados por nivel de tensión
- Estadísticas globales del sistema

## 🔧 Instalación

1. **Requisitos:**
   - XAMPP (Apache + PHP 7.4+)
   - Git

2. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Emerson3101/ICV.git
   ```

3. **Configurar en XAMPP:**
   - Copiar la carpeta `ICV` a `htdocs/`
   - Acceder via `http://localhost/ICV/`

4. **Configuración inicial:**
   - Verificar permisos de escritura en archivos JSON
   - Configurar ICVDatalink.exe si es necesario

## 📊 Uso del Sistema

### Acceso Principal
- URL: `http://localhost/ICV/`
- Interfaz principal con tabla de infracciones
- Dashboard con métricas y gráficas

### Procesamiento de Datos
1. Seleccionar fechas de inicio y fin
2. Hacer clic en "Procesar Datos"
3. El sistema ejecutará ICVDatalink.exe automáticamente
4. Los resultados se mostrarán en la tabla

### Evaluación de Infracciones
1. Marcar checkboxes "Cuenta" o "No cuenta"
2. Agregar justificaciones si es necesario
3. Guardar evaluaciones
4. Los cambios se reflejan en el ICV

### Exportación
1. Usar botones "Exportar a Excel" o "Exportar a CSV"
2. Los archivos se descargan automáticamente
3. Incluyen todas las métricas y evaluaciones

## 🔐 Autenticación

- **Contraseña por defecto:** `123`
- **Acceso:** Botón "Admin" en la barra de navegación
- **Funciones:** Administración de tags y configuración

## 📈 Métricas del Sistema

- **Total de Infracciones:** Número total de eventos fuera de límites
- **Infracciones Válidas:** Eventos marcados como "Cuenta"
- **Infracciones Justificadas:** Eventos marcados como "No cuenta"
- **ICV Global:** Tiempo promedio de infracciones válidas

## 🎨 Características de Diseño

- **Responsive:** Adaptable a diferentes tamaños de pantalla
- **Optimizado:** Carga rápida incluso con grandes volúmenes de datos
- **Intuitivo:** Interfaz fácil de usar
- **Profesional:** Diseño corporativo con logo CFE

## 🔄 Actualizaciones

### Versión 2025
- Sistema de paginación optimizado
- Dashboard con gráficas interactivas
- Exportación mejorada
- Corrección automática de evaluaciones
- Optimización de memoria

## 👨‍💻 Autor

**Emerson Salvador Plancarte Cerecedo**
- Email: emersonsalvador07@hotmail.com
- GitHub: [Emerson3101](https://github.com/Emerson3101)

## 📄 Licencia

Este proyecto es propiedad de la Comisión Federal de Electricidad (CFE) y está destinado para uso interno de la ZOTGM.

---

**Zona de Operación de Transmisión Guerrero Morelos (ZOTGM)**
*Sistema de Monitoreo de Calidad de Voltaje* 