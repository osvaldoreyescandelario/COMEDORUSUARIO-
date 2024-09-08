let groupedData = []; // Variable global para almacenar los datos agrupados
let reportData = []; // Variable global para almacenar los datos del reporte

$(document).ready(function() {
   
    // Configuración regional en español
    $.datepicker.setDefaults({
        closeText: 'Cerrar',
        prevText: '&#x3c;Ant',
        nextText: 'Sig&#x3e;',
        currentText: 'Hoy',
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Juv', 'Vie', 'Sáb'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
        weekHeader: 'Sm',
        // dateFormat: 'dd/mm/yy',
        firstDay: 1,
        isRTL: false,
        showMonthAfterYear: false,
        yearSuffix: ''
    });
    
    
    // Deshabilitar los botones al abrir el diálogo
      $("#rep-dialog").on("dialogopen", function() {
        $("#rep-exportExcel").prop("disabled", true);
        $("#rep-exportPDF").prop("disabled", true); 

         // Reiniciar los valores de los campos
        $("#rep-startDate").val('');
        $("#rep-endDate").val('');
        $("input[name='mealType']").prop("checked", false);
        $("input[name='rep-order']").prop("checked", false);
    });
   
    var dateFormat = "mm/dd/yy",
        from = $("#rep-startDate")
            .datepicker({
                defaultDate: "+1w",
                changeMonth: true,
                numberOfMonths: 1, // Mostrar solo un mes
                onSelect: function(selectedDate) {
                    var date = $(this).datepicker('getDate');
                    to.datepicker("option", "minDate", date);
                    checkFormValidity(); // Verificar la validez del formulario al seleccionar la fecha
                }
            }),
        to = $("#rep-endDate")
            .datepicker({
                defaultDate: "+1w",
                changeMonth: true,
                numberOfMonths: 1, // Mostrar solo un mes
                onSelect: function(selectedDate) {
                    var date = $(this).datepicker('getDate');
                    from.datepicker("option", "maxDate", date);
                    checkFormValidity(); // Verificar la validez del formulario al seleccionar la fecha
                }
            });

    $("#rep-dialog").dialog({
        autoOpen: false,
        modal: true,
        closeOnEscape: false, // Desactivar el cierre con Escape
        buttons: {
            // No definimos los botones aquí para evitar duplicados
        }
    });

    $("#reportBtn").click(function() {
        $("#rep-dialog").dialog("open");
    });

    $("#rep-closeDialog").click(function() {
        $("#rep-dialog").dialog("close");
    });

    $("#rep-exportExcel").click(async function() {
        await fetchReportData();

        const sortOrder = $("input[name='rep-order']:checked").val();
        const sortBy = sortOrder === 'solapin' ? 'solapin' : 'fecha';
        let datos;

        if (sortOrder === 'solapin') {
            datos = agruparPorSolapin(reportData);
            exportToExcelbySolapin(datos);
        } else {
            datos = agruparPorFecha(reportData);
            exportToExcelbyDate(reportData);
        }
    });

    $("#rep-exportPDF").click(async function() {
        await fetchReportData();
        // Implementar la lógica para exportar reportData a PDF
        const sortOrder = $("input[name='rep-order']:checked").val();
        if (sortOrder === 'fecha') {
            exportToPDFByDate(reportData);
         }
    });


    async function exportToPDFByDate(datos) {
        const { jsPDF } = window.jspdf; // Asegúrate de usar jsPDF de la biblioteca importada
        const doc = new jsPDF();
        const title = $("input[name='mealType']:checked").val() === 'desayuno' ? 'RESERVAS DE DESAYUNOS' : 'RESERVAS DE ALMUERZOS';
        
        const maxSolapinesPerColumn = 40; // Máximo de solapines por columna
        const maxColumnsPerPage = 10; // Número máximo de columnas por página
        const columnWidth = 25; // Ancho de columna en mm
        const margin = 15; // Margen en mm
        const lineHeight = 6; // Altura de línea en mm
        const maxY = 280; // Tamaño máximo en la página (en mm)
        
        const groupedData = agruparPorFecha(datos);

        // Crear una estructura para el resumen
        let summaryData = [];
        
        groupedData.forEach((dateGroup, index) => {
            let yOffset = 20; // Inicializa el desplazamiento vertical al inicio de cada grupo de fecha
            let columnCount = 0;
        
            // Agregar una nueva página para cada grupo de fecha
            if (index > 0) {
                doc.addPage();
                yOffset = 20; // Reiniciar yOffset al inicio de una nueva página
            }
        
            // Título de la página
            doc.setFontSize(10); // Tamaño de fuente ajustado
            doc.text(`${title} - ${dateGroup.fecha}`, margin, yOffset);
            yOffset += 10;
        
            let solapines = dateGroup.solapines.slice(); // Copiar el array para no modificar el original
        
            // Calcular el total de solapines por fecha para el resumen
            summaryData.push({
                fecha: dateGroup.fecha,
                total: dateGroup.solapines.length
            });

            while (solapines.length > 0) {
                if (yOffset + (maxSolapinesPerColumn * lineHeight) > maxY) {
                    doc.addPage();
                    yOffset = 20;
                    columnCount = 0;
                    doc.setFontSize(10);
                    doc.text(`${title} - ${dateGroup.fecha} (continuación)`, margin, yOffset);
                    yOffset += 10;
                }
        
                // Imprimir los solapines en columnas
                const solapinesToPrint = solapines.splice(0, maxSolapinesPerColumn);
        
                solapinesToPrint.forEach((solapin, i) => {
                    // Convertir solapin a cadena de texto si no es una
                    const solapinText = String(solapin);
        
                    if (solapinText) {
                        const xOffset = margin + (columnCount * columnWidth);
                        const yPos = yOffset + (i * lineHeight);
        
                        doc.text(solapinText, xOffset, yPos);
                    } else {
                        console.error('El solapin no es una cadena de texto o está vacío:', solapin);
                    }
                });
        
                columnCount++;
                if (columnCount >= maxColumnsPerPage) {
                    columnCount = 0;
                    yOffset += lineHeight * maxSolapinesPerColumn; // Dejar espacio antes de la siguiente columna
                }
            }
        
            // Asegurarse de que el texto se ajusta dentro de los límites de la página
            if (yOffset > maxY) {
                doc.addPage();
            }
        });
        
         // Agregar la hoja de resumen
        doc.addPage();
        yOffset = 20;
        doc.setFontSize(16);
        doc.text(`TOTAL DE ${title}`, margin, yOffset);
        yOffset += 10;

        // Crear la tabla de resumen
        doc.setFontSize(12);
        doc.text('FECHA', margin, yOffset);
        doc.text('TOTAL', margin + 80, yOffset); // Ajustar el margen según el ancho
        yOffset += 10;

        summaryData.forEach(item => {
            doc.text(item.fecha, margin, yOffset);
            doc.text(String(item.total), margin + 80, yOffset);
            yOffset += 10;
        });

        doc.save(`reporte_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    
    // Agregar manejadores de eventos para los radio buttons
    $("input[name='mealType']").change(checkFormValidity);
    $("input[name='rep-order']").change(checkFormValidity);

    // Inicializar la validez del formulario al cargar la página
    checkFormValidity();
});

function checkFormValidity() {
    const startDate = $("#rep-startDate").val();
    const endDate = $("#rep-endDate").val();
    const mealTypeSelected = $("input[name='mealType']:checked").length > 0;
    const orderSelected = $("input[name='rep-order']:checked").length > 0;
    
    const isFormValid = startDate && endDate && mealTypeSelected && orderSelected;
    $("#rep-exportExcel").prop("disabled", !isFormValid);
    $("#rep-exportPDF").prop("disabled", !isFormValid);
}

// Función para obtener los datos del reporte
async function fetchReportData() {
    const startDate = $("#rep-startDate").val();
    const endDate = $("#rep-endDate").val();
    const mealType = $("input[name='mealType']:checked").val();
    const sortOrder = $("input[name='rep-order']:checked").val();

    if (startDate && endDate && mealType && sortOrder) {
        // Convertir las fechas al formato YYYY-MM-DD
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        const tableName = mealType === 'desayuno' ? 'rdesayunos' : 'ralmuerzos';
        const sortBy = sortOrder === 'solapin' ? 'solapin' : 'fecha';

        try {
            // const response = await fetch(`http://localhost:3000/api/report/get?table=${tableName}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&sortBy=${sortBy}`, {
            const response = await fetch(`${config.apiUrl}/report/get?table=${tableName}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&sortBy=${sortBy}`, {    
                method: 'GET',
            });

            if (response.ok) {
                reportData = await response.json();
            } else {
                console.error('Error al obtener los datos:', response.statusText);
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
        }
    } else {
        console.error('Datos incompletos para obtener el reporte.');
    }
}

// Función para convertir la fecha del formato MM/DD/YYYY al formato YYYY-MM-DD
function formatDate(dateStr) {
    var [month, day, year] = dateStr.split('/').map(Number);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// Función para agrupar los datos por solapin
function agruparPorSolapin(datos) {
    const agrupado = {};

    datos.forEach((dato) => {
        const { solapin, fecha } = dato;

        // Extraer solo la parte de la fecha (YYYY-MM-DD)
        const fechaSolo = fecha ? fecha.split('T')[0] : null;

        // Asegúrate de que el solapin existe en el objeto agrupado
        if (!agrupado[solapin]) {
            agrupado[solapin] = [];
        }

        // Asegúrate de que la fecha no sea null o undefined
        if (fechaSolo) {
            agrupado[solapin].push(fechaSolo);
        }
    });

    // Convertir el objeto agrupado a un array de objetos con propiedades `solapin` y `fechas`
    return Object.keys(agrupado).map(solapin => ({
        solapin: solapin,
        fechas: agrupado[solapin]
    }));
}




// Función para agrupar los datos por fecha
function agruparPorFecha(data) {
    const grouped = data.reduce((acc, row) => {
        const fecha = new Date(row.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const solapin = row.solapin;

        let existing = acc.find(item => item.fecha === fecha);
        if (existing) {
            existing.solapines.push(solapin);
        } else {
            acc.push({ fecha, solapines: [solapin] });
        }
        return acc;
    }, []);

    return grouped;
}

async function exportToExcelbySolapin(datos) {
    const mealType = $("input[name='mealType']:checked").val();
    const title = mealType === 'desayuno' ? 'RESERVAS DE DESAYUNOS' : 'RESERVAS DE ALMUERZOS';
    const startDate = $("#rep-startDate").val();
    const endDate = $("#rep-endDate").val();

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
        Title: title,
        CreatedDate: new Date()
    };

    // Asignar directamente los datos a groupedData
    let groupedData = datos; 

    // Función para formatear la fecha en DD-MM-YYYY
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = ('0' + date.getDate()).slice(-2);
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Definir el número máximo de solapines por página
    const maxSolapinesPerSheet = 40;
    let pageData = [];
    let currentPage = 1;

    // Agregar encabezado
    pageData.push([title]);

    groupedData.forEach(group => {
        pageData.push([`Solapín: ${group.solapin}`]); // Imprimir Solapín

        // Añadir las fechas asociadas al Solapín, formateadas
        group.fechas.forEach(fecha => {
            pageData.push([formatDate(fecha)]); // Imprimir Fechas asociadas en formato DD-MM-YYYY
        });

        // Insertar una línea en blanco después de cada grupo para mejor visibilidad
        pageData.push([]);

        // Verificar si la longitud de pageData excede el límite y crear una nueva hoja si es necesario
        if (pageData.length > maxSolapinesPerSheet) {
            let worksheet = XLSX.utils.aoa_to_sheet(pageData);
            XLSX.utils.book_append_sheet(workbook, worksheet, `Página ${currentPage}`);
            pageData = [];
            currentPage++;
        }
    });

    // Agregar la última hoja si quedó algo por agregar
    if (pageData.length > 1) { // Asegurarse de que haya al menos dos filas para agregar
        let worksheet = XLSX.utils.aoa_to_sheet(pageData);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Página ${currentPage}`);
    }

    // Guardar el archivo de Excel
    XLSX.writeFile(workbook, `reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
}


async function exportToExcelbyDate(datos) {
    const mealType = $("input[name='mealType']:checked").val();
    const title = mealType === 'desayuno' ? 'RESERVAS DE DESAYUNOS' : 'RESERVAS DE ALMUERZOS';
    const startDate = $("#rep-startDate").val();
    const endDate = $("#rep-endDate").val();

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
        Title: title,
        CreatedDate: new Date()
    };

    // Determina la fuente de datos basada en sortOrder
    let groupedData = [];
    groupedData = agruparPorFecha(reportData); 
    
    const maxSolapinesPerColumn = 41;
    const maxColumnsPerPage = 14;
    let currentPage = 1;

    groupedData.forEach(dateGroup => {
      const fecha = dateGroup.fecha; // Usar la fecha tal como está
      let worksheetData = [];
      worksheetData.push([`${title} - ${fecha}`]);

      let solapines = dateGroup.solapines;
      let currentColumn = 0;

      while (solapines.length > 0) {
        let solapinesToPrint = solapines.splice(0, maxSolapinesPerColumn);

        // Asegúrate de que la primera columna esté siempre en la fila 3
        for (let i = 0; i < solapinesToPrint.length; i++) {
           if (!worksheetData[i + 2]) worksheetData[i + 2] = [];
              worksheetData[i + 2][currentColumn] = solapinesToPrint[i];
            }

         currentColumn += 1;

         if (currentColumn >= maxColumnsPerPage) {
                    break; // Stop filling columns on this page and move to the next page
          }
      }

      // Añadir la hoja para la fecha actual
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(worksheetData), fecha);
      currentPage += 1;
    });

    // Ajustar el ancho de las columnas
    workbook.SheetNames.forEach(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(ws['!ref']);
        range.e.c += 1; // Asegúrate de que el rango incluya todas las columnas
        ws['!cols'] = Array(range.e.c).fill({ wch: 5.17 });
    });

    // Generar el archivo Excel
    XLSX.writeFile(workbook, `Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
}


