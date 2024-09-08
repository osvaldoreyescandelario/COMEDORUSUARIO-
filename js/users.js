document.addEventListener("DOMContentLoaded", function() {
    var inputSolapin = document.getElementById("usersSolapin");
    var inputNombre = document.getElementById("usersNombre");
    var inputPassword = document.getElementById("usersContrasena");
    var selectRol = document.getElementById("usersRol");
    var checkboxActivo = document.getElementById("usersActivo");
    var btnModificar = document.getElementById("btnModificar");

    let currentPage = 1;
    const usersPerPage = 5; // Número de usuarios por página
    let users = []; // Array para almacenar todos los usuarios

    // Obtener el modal
    var usersModal = document.getElementById("usersModal");
    var usersBtn = document.getElementById("usersBtn");
    var span = document.getElementsByClassName("users-cerrar")[0];
    var btnCerrar = document.getElementById("btnCerrar");
    var btnExcel = document.getElementById("btnExcel");

    // Verificar que los elementos existan
    if (!usersModal || !usersBtn || !span || !btnCerrar || !btnExcel) {
        console.error("Uno o más elementos no se encontraron en el DOM.");
        return;
    }

    // Cuando el usuario hace clic en el botón, se abre el modal
    usersBtn.addEventListener("click", function() {
        usersModal.style.display = "block";
        document.body.classList.add('users-modal-open'); // Agregar clase 'users-modal-open' al body
        cargarUsuarios(); // Cargar usuarios al abrir el modal

        // Deshabilitar los elementos
        inputNombre.disabled = true;
        inputPassword.disabled = true;
        selectRol.disabled = true;
        checkboxActivo.disabled = true;
        btnModificar.disabled = true;
    });

    // Cuando el usuario hace clic en <span> (x), se cierra el modal
    span.addEventListener("click", function() {
        usersModal.style.display = "none";
        document.body.classList.remove('users-modal-open'); // Eliminar clase 'users-modal-open' del body
    });

    // Cuando el usuario hace clic en el botón "Cerrar", se cierra el modal
    btnCerrar.addEventListener("click", function() {
        usersModal.style.display = "none";
        document.body.classList.remove('users-modal-open'); // Eliminar clase 'users-modal-open' del body
    });

    // Cuando el usuario hace clic en el botón "Excel"
    btnExcel.addEventListener("click", function() {
        generarExcel(users);
    });

    // Manejar el input de solapin
    inputSolapin.addEventListener("blur", function() {
        const solapinValue = inputSolapin.value.trim();
        if (solapinValue) {
            verificarSolapin(solapinValue);
        } else {
            deshabilitarCampos();
        }
    });

    function verificarSolapin(solapin) {
        fetch(`${config.apiUrl}/auth/getUserBySolapin/${solapin}`) // Asegúrate de que esta URL sea correcta
        .then(response => {
            if (response.status === 404) {
                // Si el usuario no existe, habilitar campos para insertar
                habilitarCamposParaInsertar();
                return; // Salir de la función
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Si el usuario existe, habilitar campos
            inputNombre.value = data.nombre;
            inputPassword.value = data.password; // Si es necesario mostrar
            selectRol.value = data.rol;
            checkboxActivo.checked = data.activo;

            habilitarCamposParaModificar();
        })
        .catch((error) => {
            console.error('Error al verificar el solapin:', error);
        });
    }

    function habilitarCamposParaModificar() {
        inputNombre.disabled = false;
        inputPassword.disabled = false;
        selectRol.disabled = false;
        checkboxActivo.disabled = false;
        btnModificar.disabled = false;
        btnModificar.innerText = "Modificar"; // Cambiar el texto del botón
    }

    function habilitarCamposParaInsertar() {
        inputNombre.disabled = false;
        inputPassword.disabled = false;
        selectRol.disabled = false;
        checkboxActivo.disabled = false;
        btnModificar.disabled = false;
        btnModificar.innerText = "Insertar"; // Cambiar el texto del botón
    }

    // Validar la contraseña
    inputPassword.addEventListener("input", function() {
        const isValidPassword = validarContrasena(inputPassword.value);
        btnModificar.disabled = !isValidPassword; // Habilitar botón si la contraseña es válida
    });

    // Deshabilitar campos
    function deshabilitarCampos() {
        inputNombre.disabled = true;
        inputPassword.disabled = true;
        selectRol.disabled = true;
        checkboxActivo.disabled = true;
        btnModificar.disabled = true;
        btnModificar.innerText = "Modificar"; // Resetear texto del botón
    }

    // Función para validar la contraseña
    function validarContrasena(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{1,10}$/; // Máximo 10 caracteres
        return regex.test(password);
    }

    // Cuando el usuario hace clic en el botón "Modificar" o "Insertar"
    btnModificar.addEventListener("click", function() {
        const solapin = inputSolapin.value.trim();
        const nombre = inputNombre.value.trim();
        const password = inputPassword.value.trim();
        const rol = selectRol.value;
        const activo = checkboxActivo.checked;

        if (btnModificar.innerText === "Modificar") {
            // Lógica para actualizar el usuario
            actualizarUsuario(solapin, nombre, password, rol, activo);
        } else {
            // Lógica para insertar un nuevo usuario
            insertarUsuario(solapin, nombre, password, rol, activo);
        }
    });

    function actualizarUsuario(solapin, nombre, password, rol, activo) {
        fetch(`${config.apiUrl}/auth/updateUser`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ solapin, nombre, password, rol, activo }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al actualizar el usuario');
            }
            return response.json();
        })
        .then(data => {
            console.log('Usuario actualizado:', data);
            cargarUsuarios(); // Recargar la lista de usuarios
            deshabilitarCampos(); // Deshabilitar campos después de la actualización
        })
        .catch((error) => {
            console.error('Error al actualizar el usuario:', error);
        });
    }

    function insertarUsuario(solapin, nombre, password, rol, activo) {
        fetch(`${config.apiUrl}/auth/saveUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ solapin, nombre, password, rol, activo }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al insertar el usuario');
            }
            return response.json();
        })
        .then(data => {
            console.log('Usuario insertado:', data);
            cargarUsuarios(); // Recargar la lista de usuarios
            deshabilitarCampos(); // Deshabilitar campos después de la inserción
        })
        .catch((error) => {
            console.error('Error al insertar el usuario:', error);
        });
    }

    function cargarUsuarios() {
        fetch(`${config.apiUrl}/auth/getUsers`) // Asegúrate de que esta URL sea correcta
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            users = data; // Almacenar todos los usuarios
            currentPage = 1; // Reiniciar a la primera página
            mostrarUsuarios();
            actualizarPaginacion();
        })
        .catch((error) => {
            console.error('Error al cargar usuarios:', error);
        });
    }

    function mostrarUsuarios() {
        const tbody = document.getElementById("usersTablaUsuarios").getElementsByTagName("tbody")[0];
        tbody.innerHTML = ''; // Limpiar la tabla antes de llenarla

        const startIndex = (currentPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const paginatedUsers = users.slice(startIndex, endIndex); // Obtener los usuarios para la página actual

        paginatedUsers.forEach(function(usuario) {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = usuario.solapin;
            row.insertCell(1).innerText = usuario.nombre;
            row.insertCell(2).innerText = usuario.password; // Ten en cuenta que mostrar contraseñas no es seguro
            row.insertCell(3).innerText = usuario.rol;
        });
    }

    function actualizarPaginacion() {
        const totalPages = Math.ceil(users.length / usersPerPage);
        document.getElementById("pageInfo").innerText = `Página ${currentPage} de ${totalPages}`;

        document.getElementById("prevPage").disabled = currentPage === 1;
        document.getElementById("nextPage").disabled = currentPage === totalPages;
    }

    // Manejo de botones de paginación
    var prevPageBtn = document.getElementById("prevPage");
    var nextPageBtn = document.getElementById("nextPage");

    // Verificar que los botones existan
    if (!prevPageBtn || !nextPageBtn) {
        console.error("Los botones de paginación no se encontraron en el DOM.");
        return;
    }

    prevPageBtn.addEventListener("click", function() {
        if (currentPage > 1) {
            currentPage--;
            mostrarUsuarios();
            actualizarPaginacion();
        }
    });

    nextPageBtn.addEventListener("click", function() {
        const totalPages = Math.ceil(users.length / usersPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            mostrarUsuarios();
            actualizarPaginacion();
        }
    });

    function generarExcel(usuarios) {
        // Crear un nuevo libro de Excel
        const workbook = XLSX.utils.book_new();

        // Crear una hoja de cálculo con los datos de los usuarios
        const worksheet = XLSX.utils.json_to_sheet(usuarios);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

        // Generar el archivo Excel
        XLSX.writeFile(workbook, 'usuarios.xlsx');
    }
});
