<?php

session_name('ICV_SESION'); 
session_start();

if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    // Redirigir si no es admin
    header("Location: index.php");
    exit;
}

// resto del código...

$archivoTags = "tags.json";

// Guardar cambios
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['tags'])) {
    $tags = $_POST['tags'];
    $tagsLimpios = [];
    $valido = true;

    foreach ($tags as $tag) {
        if (
            !isset($tag['tag'], $tag['limiteInferior'], $tag['limiteSuperior'], $tag['nivel_tension']) ||
            trim($tag['tag']) === '' ||
            !is_numeric($tag['limiteInferior']) ||
            !is_numeric($tag['limiteSuperior']) ||
            !is_numeric($tag['nivel_tension'])
        ) {
            $valido = false;
            break;
        }

        $tagsLimpios[] = [
            'tag' => $tag['tag'],
            'limiteInferior' => (float)$tag['limiteInferior'],
            'limiteSuperior' => (float)$tag['limiteSuperior'],
            'nivel_tension' => (int)$tag['nivel_tension']
        ];
    }

    if ($valido) {
        file_put_contents($archivoTags, json_encode($tagsLimpios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        header("Location: " . $_SERVER['PHP_SELF'] . "?guardado=1");
        exit;
    } else {
        header("Location: " . $_SERVER['PHP_SELF'] . "?error=1");
        exit;
    }
}

$tags = json_decode(file_get_contents($archivoTags), true);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Administrador de Tags</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link rel="stylesheet" href="estilo.css">
    <style>
        input:disabled,
        select:disabled {
            background-color: rgb(133, 172, 114);
            border: none;
        }
    </style>
</head>
<body>
<div class="container my-4">
    <h5 class="text-center">Administrador de Tags</h5>
    <div class="text-center mt-3">
        <button type="button" id="btn-editar" class="btn btn-primary boton me-3">Editar</button>
        <button type="button" id="btn-agregar" class="btn btn-secondary boton d-none me-3">Agregar Tag</button>
        <button type="submit" id="btn-guardar" class="btn btn-success boton d-none me-3">Guardar cambios</button>
        <button type="button" id="btn-cancelar" class="btn btn-danger boton d-none me-3">Cancelar</button>
        <button type="button" id="btn-eliminar-activar" class="btn btn-warning boton d-none me-3">Eliminar Tag</button>
        <a class="btn btn-outline-secondary boton ms-auto me-3" href="index.php">Regresar a menú</a>
    </div><br>

    <?php if (isset($_GET['guardado'])): ?>
        <div id="msg-guardado" class="alert alert-success text-center">Cambios guardados.</div>
    <?php elseif (isset($_GET['error'])): ?>
        <div class="alert alert-danger text-center">Error: todos los campos deben completarse correctamente.</div>
    <?php endif; ?>

    <form method="POST" id="form-tags">
        <div class="table-responsive">
            <table class="table table-bordered table-sm text-center align-middle" id="tabla-tags">
                <thead class="table-light">
                <tr>
                    <th>#</th>
                    <th>Tag</th>
                    <th>Límite Inferior</th>
                    <th>Límite Superior</th>
                    <th>Nivel de Tensión</th>
                    <th class="col-eliminar d-none">Eliminar</th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($tags as $index => $tag): ?>
                    <tr>
                        <td><?= $index + 1 ?></td>
                        <td><input type="text" name="tags[<?= $index ?>][tag]" class="form-control" value="<?= htmlspecialchars($tag['tag']) ?>" disabled required></td>
                        <td><input type="number" step="any" name="tags[<?= $index ?>][limiteInferior]" class="form-control" value="<?= htmlspecialchars($tag['limiteInferior']) ?>" disabled required></td>
                        <td><input type="number" step="any" name="tags[<?= $index ?>][limiteSuperior]" class="form-control" value="<?= htmlspecialchars($tag['limiteSuperior']) ?>" disabled required></td>
                        <td><input type="number" step="any" name="tags[<?= $index ?>][nivel_tension]" class="form-control" value="<?= htmlspecialchars($tag['nivel_tension']) ?>" disabled required></td>
                        <td class="col-eliminar d-none"><button type="button" class="btn btn-sm btn-danger btn-eliminar">X</button></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </form>
</div>

<script>
document.addEventListener("DOMContentLoaded", function () {
    const btnEditar = document.getElementById("btn-editar");
    const btnAgregar = document.getElementById("btn-agregar");
    const btnGuardar = document.getElementById("btn-guardar");
    const btnCancelar = document.getElementById("btn-cancelar");
    const btnEliminarActivar = document.getElementById("btn-eliminar-activar");
    const tabla = document.querySelector("#tabla-tags tbody");
    const form = document.getElementById("form-tags");

    let eliminacionActiva = false;

    btnEditar.addEventListener("click", () => {
        document.querySelectorAll("input, select").forEach(el => el.disabled = false);
        btnEditar.classList.add("d-none");
        btnAgregar.classList.remove("d-none");
        btnGuardar.classList.remove("d-none");
        btnCancelar.classList.remove("d-none");
        btnEliminarActivar.classList.remove("d-none");
    });

    btnAgregar.addEventListener("click", () => {
        const index = tabla.rows.length;
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td><input type="text" name="tags[${index}][tag]" class="form-control" required></td>
            <td><input type="number" step="any" name="tags[${index}][limiteInferior]" class="form-control" required></td>
            <td><input type="number" step="any" name="tags[${index}][limiteSuperior]" class="form-control" required></td>
            <td><input type="number" step="any" name="tags[${index}][nivel_tension]" class="form-control" required></td>
            <td class="col-eliminar ${eliminacionActiva ? "" : "d-none"}">
                <button type="button" class="btn btn-sm btn-danger btn-eliminar">X</button>
            </td>
        `;
        tabla.appendChild(fila);
    });

    btnCancelar.addEventListener("click", () => {
        window.location.reload();
    });

    btnEliminarActivar.addEventListener("click", () => {
        eliminacionActiva = !eliminacionActiva;
        document.querySelectorAll(".col-eliminar").forEach(el => el.classList.toggle("d-none", !eliminacionActiva));
        btnEliminarActivar.textContent = eliminacionActiva ? "Desactivar eliminación" : "Eliminar Tag";
        btnEliminarActivar.classList.toggle("btn-warning", !eliminacionActiva);
        btnEliminarActivar.classList.toggle("btn-secondary", eliminacionActiva);
    });

    tabla.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-eliminar")) {
            e.target.closest("tr").remove();
            actualizarIndices();
        }
    });

    btnGuardar.addEventListener("click", (e) => {
        e.preventDefault();
        form.submit();
    });

    function actualizarIndices() {
        const filas = tabla.querySelectorAll("tr");
        filas.forEach((fila, i) => {
            fila.querySelector("td").textContent = i + 1;
        });
    }

    const msgGuardado = document.getElementById("msg-guardado");
    if (msgGuardado) {
        setTimeout(() => {
            msgGuardado.style.transition = "opacity 0.5s ease";
            msgGuardado.style.opacity = 0;
            setTimeout(() => msgGuardado.remove(), 500);
        }, 4000);
    }
});
</script>
</body>
</html>
