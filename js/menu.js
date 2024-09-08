document.addEventListener("DOMContentLoaded", function() {
    const menuBtn = document.getElementById("menuBtn"); // Botón para abrir el modal
    const modal = document.getElementById("Menumodal");
    const closeModalButton = document.getElementById("MenucloseButton");
    const saveButton = document.getElementById("MenusaveButton");
    const monthSelect = document.getElementById("MenumonthSelect");
    const tableBody = document.getElementById("MenutableBody");
    const prevPageButton = document.getElementById("MenuprevPage");
    const nextPageButton = document.getElementById("MenunextPage");

    let currentPage = 0;
    const rowsPerPage = 5;
    let dataChanged = false;
    let menuData = [];

    saveButton.disabled = true;
    disablesaveButton();

    menuBtn.onclick = function() {
        modal.style.display = "block";
        loadMenuData(); // Cargar los datos del menú desde el servidor
    }

    closeModalButton.onclick = function() {
        if (dataChanged && confirm("¿Desea salvar los cambios?")) {
            saveData(); 
        }
        modal.style.display = "none";
        dataChanged = false;
        saveButton.disabled = true;
        disablesaveButton();
    }

    monthSelect.onchange = function() {
        if (dataChanged && confirm("¿Desea salvar los cambios?")) {
            saveData(); 
        }
        loadMenuData(); // Cargar los datos del menú para el mes seleccionado
    }

    function loadMenuData() {
        const month = parseInt(monthSelect.value);
        const year = new Date().getFullYear();
    
        fetch(`${config.apiUrl}/menu/${year}/${month}`)
            .then(response => response.json())
            .then(data => {
                menuData = data;
                console.log('Datos cargados desde la base de datos:', menuData);
                loadDays();
            })
            .catch(error => console.error('Error al cargar los datos del menú:', error));
    }

    function loadDays() {
        const month = parseInt(monthSelect.value);
        const year = new Date().getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = currentPage * rowsPerPage;
        const endDay = startDay + rowsPerPage;
    
        tableBody.innerHTML = "";
    
        for (let day = startDay + 1; day <= daysInMonth && day <= endDay; day++) {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
            // Buscar la fecha en el formato correcto
            const dayData = menuData.find(d => {
                let dataDate = d.fecha.split('T')[0]; // Extraer solo la parte de la fecha
                return dataDate === date;
            }) || {};
    
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(year, month, day).toLocaleString('es-ES', { weekday: 'long' })} ${day}</td>
                <td contenteditable="true">${dayData.desayuno || ''}</td>
                <td contenteditable="true">${dayData.Adesayuno || ''}</td>
                <td contenteditable="true">${dayData.Edesayuno || ''}</td>
                <td contenteditable="true">${dayData.almuerzo || ''}</td>
                <td contenteditable="true">${dayData.Aalmuerzo || ''}</td>
                <td contenteditable="true">${dayData.Ealmuerzo || ''}</td>
            `;
    
            // Validar el contenido editable para que acepte solo números con hasta 2 decimales
            const editableCells = row.querySelectorAll('td[contenteditable="true"]');
            editableCells.forEach(cell => {
                let previousValue = cell.innerText;
                
                cell.addEventListener('input', function() {
                    const value = cell.innerText;
    
                    // Validación: Solo permitir números con hasta 2 decimales
                    const regex = /^\d*(\.\d{0,2})?$/;
                    if (!regex.test(value)) {
                        cell.innerText = previousValue;
                    } else {
                        previousValue = value;
                        dataChanged = true;
                        saveButton.disabled = false;
                        enablesaveButton();
                    }
                });
    
                cell.addEventListener('blur', function() {
                    // Eliminar cualquier formato no válido al salir de la celda
                    const value = parseFloat(cell.innerText);
                    if (isNaN(value)) {
                        cell.innerText = '';
                    } else {
                        cell.innerText = value.toFixed(2);
                    }
                });
            });
    
            tableBody.appendChild(row);
        }
    }
    
        
    saveButton.onclick = function() {
        saveData();
    }

    function disablesaveButton() {
        // Cambiar el estilo del botón a deshabilitado
        saveButton.style.backgroundColor = "#cccccc"; // Color gris para el fondo
        saveButton.style.color = "#666666"; // Color gris para el texto
        saveButton.style.cursor = "not-allowed"; // Cambiar el cursor a no permitido
    }

    function enablesaveButton() {
        // Cambiar el estilo del botón a habilitado
        saveButton.style.backgroundColor = "#003366"; // Azul oscuro
        saveButton.style.color = "white"; // Color blanco para el texto
        saveButton.style.cursor = "pointer"; // Cambiar el cursor a puntero
    }

    function saveData() {
        const month = parseInt(monthSelect.value);
        const year = new Date().getFullYear();
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach((row, index) => {
            const day = currentPage * rowsPerPage + index + 1;
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const [desayuno, Adesayuno, Edesayuno, almuerzo, Aalmuerzo, Ealmuerzo] = Array.from(row.querySelectorAll('td[contenteditable="true"]')).map(cell => parseFloat(cell.innerText) || null);

            fetch(`${config.apiUrl}/menu/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fecha: date, desayuno, Adesayuno, Edesayuno, almuerzo, Aalmuerzo, Ealmuerzo })
            })
            .then(response => response.json())
            .then(result => console.log(result))
            .catch(error => console.error('Error al guardar los datos:', error));
        });

        alert("Datos guardados.");
        dataChanged = false;
        saveButton.disabled = true;
        disablesaveButton();
    }

    prevPageButton.onclick = function() {
        if (dataChanged && confirm("¿Desea salvar los cambios?")) {
            saveData();
        }
        if (currentPage > 0) {
            currentPage--;
            loadDays();
        }
    }

    nextPageButton.onclick = function() {
        if (dataChanged && confirm("¿Desea salvar los cambios?")) {
            saveData();
        }
        const month = parseInt(monthSelect.value);
        const daysInMonth = new Date(new Date().getFullYear(), month + 1, 0).getDate();
        if ((currentPage + 1) * rowsPerPage < daysInMonth) {
            currentPage++;
            loadDays();
        }
    }
});
