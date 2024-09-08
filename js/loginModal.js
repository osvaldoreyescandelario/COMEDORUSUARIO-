// Variable global para almacenar los datos del usuario
// let currentUser = null;



document.addEventListener("DOMContentLoaded", function() {
    const loginBtn = document.querySelector(".login-btn");
    const loginModal = document.querySelector(".login-modal");
    const closeLoginModalBtn = document.querySelector("#closeLoginModalBtn");
    const showPasswordCheckbox = document.getElementById("showPassword");
    const passwordInput = document.getElementById("password");
    const passwordError = document.getElementById("passwordError");
    const loginModalBtn = document.getElementById("loginModalBtn");
    const solapinInput = document.getElementById("solapin");
    
    const setupIcon = document.getElementById('setupIcon');
    let SetupChangesMade = false;

    // Dialogo modal de Configuracion *************************************
    const modal = document.getElementById("STPconfigModal");
    const saveButton = document.getElementById("STPsaveButton");
    const closeButton = document.getElementById("STPcloseButton");
    const inputs = document.querySelectorAll('#STPconfigModal input, #STPconfigModal textarea');
    const dateInputs = document.querySelectorAll('#STPconfigModal input[type="date"]');
    const infoTextControl = document.getElementById("STPinfoText");
    const showFooterCheckbox = document.getElementById("STPactivateCheckbox");


    // Abre el modal y carga los datos iniciales
    function openModal() {
        modal.style.display = "block";
        saveButton.disabled = true;

        // Inicializar los controles del modal con los valores de Cfg
        const dates = Cfg[0].daysToBlock.split('/');
        dateInputs[0].value = dates[0];
        dateInputs[1].value = dates[1];
        infoTextControl.value = Cfg[1].news;
        showFooterCheckbox.checked = Cfg[2].active === 1;
    }

    function updateFooterVisibility() {
        const footer = document.querySelector("footer");
        const footerSpan = document.querySelector("footer .marquee span");
    
        if (Cfg[2].active === 1) {
            footer.style.display = "block";
            footerSpan.textContent = Cfg[1].news; // Actualizar el texto del span con el contenido de news
        } else {
            footer.style.display = "none";
        }
    }

    // Cierra el modal
    function closeModal() {
        if (SetupChangesMade) {
            const confirmClose = confirm("¿Desea salvar los cambios?");
            if (confirmClose) {
                if (validateDates()) {
                    saveChanges(true); // Pasar true para cerrar el modal después de guardar
                }
            } else {
                modal.style.display = "none";
            }
        } else {
            modal.style.display = "none";
        }
    }

    // Guarda los cambios y actualiza la variable global
    function saveChanges(shouldCloseModal = false) {
        if (validateDates()) {
            
            // Actualizar la variable global Cfg
            Cfg[0].daysToBlock = `${dateInputs[0].value}/${dateInputs[1].value}`;
            Cfg[1].news = infoTextControl.value;
            Cfg[2].active = showFooterCheckbox.checked ? 1 : 0;

            updateFooterVisibility();

            saveButton.disabled = true;
            SetupChangesMade = false;

            // Llamar a la función para actualizar la base de datos
            updateConfigurationInDatabase(Cfg[1].news, Cfg[2].active, Cfg[0].daysToBlock);

            if (shouldCloseModal) {
                modal.style.display = "none";
            }
        }
    }

    // Verifica que la segunda fecha sea igual o mayor que la primera
    function validateDates() {
        const startDate = new Date(dateInputs[0].value);
        const endDate = new Date(dateInputs[1].value);

        if (endDate >= startDate) {
            return true;
        } else {
            dateInputs[1].value = ''; // Reinicia el selector de la segunda fecha
            saveButton.disabled = true;
            alert("La segunda fecha debe ser igual o mayor que la primera fecha.");
            return false;
        }
    }

    // Eventos para cerrar el modal
    closeButton.onclick = closeModal;
    
    // Capturar el clic en el botón de salvar
    saveButton.onclick = () => saveChanges(false); // No cerrar el modal después de guardar

    // Detectar cambios en los inputs y habilitar el botón de salvar
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            SetupChangesMade = true;
            saveButton.disabled = false;
        });
    });

    // Detectar cambios en los campos de fecha y validar
    dateInputs.forEach(input => {
        input.addEventListener('change', validateDates);
    });

    // Función a ejecutar cuando se hace clic en el icono
    function handleIconClick() {
        alert('Icono de configuración clickeado');
        openModal();
    }

    // Añadir el evento de clic al icono
    setupIcon.addEventListener('click', handleIconClick);
    // Fin dialogo modal de Configuracion *************************************

    // Leer la configuracion desde la base de datos
    async function initializeCfgFromDatabase() {
        try {
            // Realiza la solicitud a la API
            const response = await fetch(`${config.apiUrl}/configuracion`, {
                method: 'GET',
            });
            
            // Verifica si la respuesta es exitosa
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
    
            // Convierte la respuesta a JSON
            const data = await response.json();
    
            // Asegúrate de que los datos estén en el formato esperado
            if (data && data.noticia && data.noticiaactiva !== undefined && data.bloquear) {
                // Inicializa Cfg con los datos obtenidos
                Cfg = [
                    { daysToBlock: data.bloquear },
                    { news: data.noticia },
                    { active: data.noticiaactiva }
                ];
    
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error('Failed to initialize Cfg:', error);
        }
    }

    // Función para actualizar la configuración en la base de datos
    async function updateConfigurationInDatabase(noticia, noticiaactiva, bloquear) {
        try {
            const response = await fetch(`${config.apiUrl}/configuracion`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    noticia: noticia,
                    noticiaactiva: noticiaactiva,
                    bloquear: bloquear
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
        } catch (error) {
            console.error('Failed to update configuration:', error);
        }
    }

    // Deshabilitar todos los botones excepto el de Iniciar Sesión y los del diálogo de login
    setupIcon.style.display = 'none'; //Oculta el icono setup
    const allButtons = document.querySelectorAll("button:not(.login-btn):not(#loginModalBtn):not(#closeLoginModalBtn)");
    const adminButtons = document.querySelectorAll("#usersBtn, #reportBtn, #menuBtn");
    allButtons.forEach(button => {
        button.disabled = true; // Deshabilitar el botón
    });

    // Abre el modal de inicio de sesión
    loginBtn.addEventListener("click", function() {
        loginModal.style.display = "block";
    });

    // Cierra el modal
    closeLoginModalBtn.addEventListener("click", function() {
        loginModal.style.display = "none";
    });

    // Muestra u oculta la contraseña
    showPasswordCheckbox.addEventListener("change", function() {
        passwordInput.type = this.checked ? "text" : "password";
    });

    // Valida la robustez de la contraseña
    // Expresión regular para validar la contraseña
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    passwordInput.addEventListener("input", function() {
        const password = this.value;

        if (!strongPasswordRegex.test(password)) {
            passwordError.style.display = "block"; // Mostrar mensaje de error
        } else {
            passwordError.style.display = "none"; // Ocultar mensaje de error
        }
    });

    // Habilitar el botón de inicio de sesión cuando ambos campos no estén vacíos
    function toggleLoginButton() {
        if (solapinInput.value && passwordInput.value) {
            loginModalBtn.disabled = false;
        } else {
            loginModalBtn.disabled = true;
        }
    }

    solapinInput.addEventListener("input", toggleLoginButton);
    passwordInput.addEventListener("input", toggleLoginButton);

    // Inicialmente, el botón de inicio de sesión debe estar habilitado si los campos no están vacíos
    toggleLoginButton();

    // Manejar el evento de clic en el botón de Iniciar/Cerrar Sesión
    loginModalBtn.addEventListener("click", async function() {
        const solapin = solapinInput.value;
        const password = passwordInput.value;

        try {
            // Usa la URL del objeto config global
            const response = await fetch(`${config.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ solapin, password })
            });

            const result = await response.json();
            console.log(result);
            if (response.ok) {
                
                // Verifica si el usuario está activo
                if (!result.activo) {
                    alert("El usuario no está activo. Por favor, contacta al administrador.");
                    return; // Salir si el usuario no está activo
    }
                loginModal.style.display = "none"; // Cerrar modal

                currentUser = {
                    solapin: result.solapin, // Asegúrate de que el servidor devuelva el solapin
                    nombre: result.nombre, // Asegúrate de que el servidor devuelva el nombre
                    contrasena: password, // Almacenar la contraseña (considera la seguridad)
                    rol: result.rol,
                };
                

                // Habilitar los botones después de iniciar sesión
                allButtons.forEach(button => {
                    button.disabled = false; // Habilitar el botón
                    initializeCfgFromDatabase();
                    updateFooterVisibility();
                });
                setupIcon.style.display = 'inline';
                // Cambiar el texto del botón de login
                loginBtn.textContent = "Cerrar Sesión";

                // Obtener el rol del usuario desde el servidor
                const userRole = result.rol;

                // Si el usuario no es admin, deshabilitar los botones específicos
                if (userRole !== "admin") {
                    adminButtons.forEach(button => {
                        button.disabled = true; // Deshabilitar el botón
                    });
                    setupIcon.style.display = 'none';
                }

                // Almacenar el rol en localStorage
                localStorage.setItem('userRole', userRole);

                // Agregar evento para cerrar sesión
                loginBtn.onclick = function() {
                    // Restablecer el estado
                    allButtons.forEach(button => {
                        button.disabled = true; // Deshabilitar el botón
                    });
                    setupIcon.style.display = 'none';
                    loginBtn.textContent = "Iniciar Sesión"; // Cambiar el texto
                    solapinInput.value = ""; // Limpiar el campo de usuario
                    passwordInput.value = ""; // Limpiar el campo de contraseña
                    passwordError.style.display = "none"; // Ocultar mensaje de error
                    localStorage.removeItem('userRole'); // Eliminar el rol almacenado
                };
            } else {
                passwordError.textContent = result.error;
                passwordError.style.display = "block"; // Mostrar mensaje de error
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al intentar iniciar sesión.');
        }
    });
});