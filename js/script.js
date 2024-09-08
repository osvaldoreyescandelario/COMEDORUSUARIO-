
// Inicializa breakfasts y lunches con fechas específicas
let breakfasts = [
  { month: 7, day: 5 }, { month: 7, day: 6 }, { month: 7, day: 7 },
  { month: 7, day: 8 }, { month: 7, day: 9 },
  { month: 7, day: 12 }, { month: 7, day: 13 }, { month: 7, day: 14 },
  { month: 7, day: 15 }, { month: 7, day: 16 },
  { month: 7, day: 19 }, { month: 7, day: 20 }, { month: 7, day: 21 },
  { month: 7, day: 22 }, { month: 7, day: 23 },
  { month: 7, day: 26 }, { month: 7, day: 27 }, { month: 7, day: 28 },
  { month: 7, day: 29 }, { month: 7, day: 30 },
  { month: 8, day: 9 }, { month: 8, day: 10 },
  { month: 9, day: 7 },
  { month: 10, day: 14 },
  { month: 11, day: 23 }
];

let lunches = [...breakfasts]; // Inicializa lunches igual a breakfasts
let tempBookings = [];
let changesMade = false;

document.addEventListener("DOMContentLoaded", function() {
  const calendarDiv = document.getElementById("calendar");
  const saveBtn = document.getElementById("saveBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const openBreakfastModalBtn = document.getElementById("openBreakfastModalBtn");
  const openLunchModalBtn = document.getElementById("openLunchModalBtn");
  const openconsumptionBtn = document.getElementById("consumptionBtn");
  const calendarModal = document.getElementById("calendarModal");
  const modalTitle = document.getElementById("modalTitle");
  const yearSpinbox = document.getElementById("yearSpinbox");

  const today = new Date();
  const currentYear = today.getFullYear();

  yearSpinbox.min = currentYear;
  yearSpinbox.max = currentYear + 1;
  yearSpinbox.value = currentYear;

  // Añadir validación al input
  yearSpinbox.addEventListener("input", function() {
    const value = parseInt(yearSpinbox.value);
    if (value < currentYear || value > currentYear + 1) {
      yearSpinbox.value = currentYear; // Restablece al año actual si el valor no es válido
    }
  });


  let months = [
    { name: "Enero", days: 31 },
    { name: "Febrero", days: 28 },
    { name: "Marzo", days: 31 },
    { name: "Abril", days: 30 },
    { name: "Mayo", days: 31 },
    { name: "Junio", days: 30 },
    { name: "Julio", days: 31 },
    { name: "Agosto", days: 31 },
    { name: "Septiembre", days: 30 },
    { name: "Octubre", days: 31 },
    { name: "Noviembre", days: 30 },
    { name: "Diciembre", days: 31 }
  ];

  
  openBreakfastModalBtn.addEventListener("click", async function() {
    modalTitle.textContent = "Reservas de desayunos";
    calendarModal.style.display = "block";

    // Cargar reservas existentes desde la base de datos
    const response = await fetch(`${config.apiUrl}/reservas/rdesayunos?solapin=${currentUser.solapin}`);
    const existingBookings = await response.json();
    breakfasts = existingBookings.map(booking => ({
        month: new Date(booking.fecha).getMonth(),
        day: new Date(booking.fecha).getDate()
    }));
    
    tempBookings = [...breakfasts]; // Usar breakfasts
    renderCalendar();

    saveBtn.disabled = true;
    saveBtn.classList.add('disabled');
    changesMade = false;
});

openLunchModalBtn.addEventListener("click", async function() {
  modalTitle.textContent = "Reservas de almuerzos";
  calendarModal.style.display = "block";

  // Cargar reservas existentes desde la base de datos
  const response = await fetch(`${config.apiUrl}/reservas/ralmuerzos?solapin=${currentUser.solapin}`);
  const existingBookings = await response.json();
  lunches = existingBookings.map(booking => ({
      month: new Date(booking.fecha).getMonth(),
      day: new Date(booking.fecha).getDate()
  }));

  tempBookings = [...lunches]; // Usar lunches
  renderCalendar();

  saveBtn.disabled = true;
  saveBtn.classList.add('disabled');
  changesMade = false;
});

function getDatesForCurrentYear() {
  const dates = [];
  const today = new Date();
  const currentYear = today.getFullYear();

  // Comenzar desde el primer día del año
  const startDate = new Date(currentYear, 0, 1); // 1 de enero

  // Iterar desde el primer día del año hasta el día actual
  for (let d = startDate; d <= today; d.setDate(d.getDate() + 1)) {
      // Formatear la fecha en YYYY-MM-DD
      const formattedDate = d.toISOString().split('T')[0];
      dates.push(formattedDate);
  }

  return dates;
}

  //Comprobar si el dia ya esta cerrado en la base de datos 
  // Ruta # 2
  async function dayClosed(date, Opt) {
    const field = Opt === 0 ? 'cierredesayuno' : 'cierrealmuerzo'; // Determina el campo a usar
    

    // Ruta para obtener el estado del día cerrado
    const url = `${config.apiUrl}/menu?date=${date}&field=${field}`;

    try {
        const response = await fetch(url);

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            throw new Error('Error al obtener los datos del menú');
        }

        const data = await response.json();
        
        // Asegúrate de que el formato de la respuesta sea el esperado
        // const value = data[field]; // Accede directamente al campo correspondiente
       
        return data === 1; // Retorna true si es 1, false si es 0
    } catch (error) {
        console.error('Error:', error);
        return false; // Retorna false en caso de error
    }
  }

  async function generateDailyDiscount(date, field) {
    const costs = await fetchMenuData(date,field);//desayuno 
    const quantity = await fetchDataByDate(date, field, currentUser.solapin);
  
    // Crear el array discount
    const discount = [];


    // Calcular el total y llenar el array discount
    quantity.forEach(item => {
        const total = (item.rp + item.ra) * costs.A + item.ex * costs.E; // Calcular el total
        discount.push({ solapin: item.solapin, discount: total }); // antes total y puse discount
    });
    
    return discount; 
  }

  //Obtener los costos de desayuno o almuerzo para un dia dado
  //Ruta # 14
  async function fetchMenuData(dateValue, switchState) {
    const costos = { A: 0, C: 0, E: 0 }; // Inicializar costos como un objeto

    try {
        let fields;
        if (switchState === 0) {
            fields = ['Adesayuno', 'desayuno', 'Edesayuno']; // Campos para desayuno
        } else {
            fields = ['Aalmuerzo', 'almuerzo', 'Ealmuerzo']; // Campos para almuerzo
        }

        // Hacer fetch para obtener todos los campos a la vez
        const response = await fetch(`${config.apiUrl}/menu-data?date=${dateValue}&fields=${fields.join(',')}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Error al obtener los datos del menú');
        }

        const data = await response.json();

        // Asignar los valores a costos, asegurando que sean números
        costos.A = parseFloat(data[fields[0]]) || 0; // Adesayuno o Aalmuerzo
        costos.C = parseFloat(data[fields[1]]) || 0; // desayuno o almuerzo
        costos.E = parseFloat(data[fields[2]]) || 0; // Edesayuno o Ealmuerzo

        return costos; // Devolver la variable costos
    } catch (error) {
        console.error('Error al obtener los datos del menú:', error);
        return null; // Devolver null en caso de error
    }
  }

  function checkSolapinInReservas(solapinesString, targetSolapin) {
    // Descomponer la cadena en un arreglo de solapines y filtrar los vacíos
    const solapinesArray = solapinesString.split('/')
        .map(Number) // Convertir a números
        .filter(solapin => !isNaN(solapin)); // Filtrar valores no válidos (NaN)
  
    // Verificar si el solapin objetivo está incluido en el arreglo
    const isIncluded = solapinesArray.includes(targetSolapin);
  
    return isIncluded; // Retornar true si está incluido, false en caso contrario
   }

   // función que descompone una cadena de solapines en un arreglo de valores enteros 
  //válidos y cuenta cuántos de esos solapines son distintos a un solapin dado
  function countDistinctSolapines(solapinesString, targetSolapin) {
    if (solapinesString == '') {
      return 0;
    }
    // Descomponer la cadena en un arreglo de solapines y filtrar los vacíos
    const solapinesStr = solapinesString.slice(0, -1);
    const solapinesArray = solapinesStr.split('/').map(Number).filter(solapin => !isNaN(solapin));
    // Contar cuántos solapines son distintos al solapin dado
    const distinctCount = solapinesArray.filter(solapin => solapin !== targetSolapin).length;
    return distinctCount; // Retornar la cantidad de solapines distintos
  }

  //Obtener a quienes hay que cobrar y las cantidades
  //Ruta # 19
  async function fetchDataByDate(dateValue, switchState, solapinValue) {
    const cant = []; // Inicializar la variable para almacenar los resultados

    try {
      const table = switchState === '0' ? 'consumodesayunos' : 'consumoalmuerzos';
      const response = await fetch(`${config.apiUrl}/consumo?fecha=${dateValue}&solapin=${solapinValue}&switchState=${switchState}`);
      if (!response.ok) {
        throw new Error('Error al obtener los datos');
      }
      const data = await response.json();
      
        let rp = 0;
        let ra = 0;
        // Filtrar los resultados según las condiciones especificadas
        data.forEach(item => {
            rp = 0;
            ra = 0;
            const ex = item.extras || 0;
            const ie = item.invitadosefectivo || 0;
            const it = item.invitadostrabajador || 0;
            const ig = item.invitadosgasto || 0;  
            
            // Verificar condiciones para rp y ra
            if (item.conreserva && item.usada && checkSolapinInReservas(item.reservas, item.solapin)) {
                rp = 1;
            }
            const numbersolapin = countDistinctSolapines(item.reservas, item.solapin);
            if (item.conreserva && item.usada && numbersolapin > 0) {
                ra = numbersolapin;
            }
            if (!item.conreserva && !item.usada && numbersolapin > 0) {
                rp = 0;
                ra = numbersolapin;
            }
      
            const solapin = item.solapin;

            // Crear un objeto con los resultados
            const result = {
                solapin: solapin,
                rp: rp,
                ra: ra,
                ex: ex,
                ie: ie,
                it: it,
                ig: ig
            };
            cant.push(result); // Agregar el objeto al array
       });
       return cant; // Devolver la variable cant
        
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

  function getTotalDiscountDay(breakfastDiscount, lunchDiscount) {
    // Inicializar el arreglo totalDiscount
    const totalDiscount = [];

    // Recorrer breakfastDiscount y agregar los valores a totalDiscount
    breakfastDiscount.forEach(b => {
        totalDiscount.push({
            solapin: b.solapin,
            Desayuno: b.discount,
            Almuerzo: 0,
            Total: b.discount
        });
    });
    // Recorrer lunchDiscount para actualizar totalDiscount
    lunchDiscount.forEach(l => {
        // Buscar si el solapin ya está en totalDiscount
        const existingEntry = totalDiscount.find(t => t.solapin === l.solapin);
        
        if (existingEntry) {
            // Si el solapin ya está, actualizar Almuerzo y Total
            existingEntry.Almuerzo = l.discount;
            existingEntry.Total = existingEntry.Desayuno + l.discount;
        } else {
            // Si el solapin no está, agregarlo con Desayuno = 0
            totalDiscount.push({
                solapin: l.solapin,
                Desayuno: 0,
                Almuerzo: l.discount,
                Total: l.discount
            });
        }
    });
    // Ordenar totalDiscount por solapin de menor a mayor
    totalDiscount.sort((a, b) => a.solapin - b.solapin);
    return totalDiscount;
  }

  function exportToPDF(fileName, title, subtitle, discountUser) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Títulos
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });

      // Calcular totales
      let totalDesayuno = 0;
      let totalAlmuerzo = 0;
      let totalGeneral = 0;

      // Preparar los datos para la tabla
      const tableRows = discountUser.map(item => {
          totalDesayuno += item.Desayuno;
          totalAlmuerzo += item.Almuerzo;
          totalGeneral += item.Total;

          return [
              item.fecha,
              item.Desayuno.toFixed(2), // Quitar símbolo de moneda, solo dos decimales
              item.Almuerzo.toFixed(2),
              item.Total.toFixed(2)
          ];
      });

      // Agregar la fila de totales
      tableRows.push([
          'TOTALES',
          totalDesayuno.toFixed(2),
          totalAlmuerzo.toFixed(2),
          totalGeneral.toFixed(2)
      ]);

      // Generar la tabla con autoTable
      doc.autoTable({
          head: [['Fecha', 'Desayuno', 'Almuerzo', 'Total']], // Encabezados de la tabla
          body: tableRows,
          theme: 'grid',
          styles: {
              fontSize: 10,
              cellPadding: 4,
              halign: 'center'
          },
          headStyles: {
              fillColor: [220, 220, 220], // Fondo gris claro para los encabezados
              textColor: 0, // Texto en negro
              fontStyle: 'bold'
          },
          footStyles: {
              fillColor: [220, 220, 220], // Fondo gris claro para la fila de totales
              textColor: 0, // Texto en negro
              fontStyle: 'bold'
          },
          startY: 40
      });

      // Guardar el PDF
      doc.save(fileName + '.pdf');
  }

  openconsumptionBtn.addEventListener("click", async function() {//aqui
    // currentUser.solapin
    const daysToCalculate = getDatesForCurrentYear();
    let discountUser = [];
    for (let i = 0; i < daysToCalculate.length - 1; i++) {
      const breakfatDayClosed = await dayClosed(daysToCalculate[i], 0);
      const lunchDayClosed = await dayClosed(daysToCalculate[i], 1);

      if (breakfatDayClosed && lunchDayClosed) {
        const breakfastDiscount = await generateDailyDiscount(daysToCalculate[i], 0);
        const lunchDiscount = await generateDailyDiscount(daysToCalculate[i], 1);
        const totalDiscount = getTotalDiscountDay(breakfastDiscount, lunchDiscount);

        if (totalDiscount.length > 0) {
          const discountData = totalDiscount[0]; // Acceder al primer elemento del arreglo
          
          discountUser.push({
            fecha: daysToCalculate[i],
            Desayuno: discountData.Desayuno,
            Almuerzo: discountData.Almuerzo,
            Total: discountData.Total
          });
        }
      } else {
        if (breakfatDayClosed && !lunchDayClosed) {
          const breakfastDiscount = await generateDailyDiscount(daysToCalculate[i], 0);
          const lunchDiscount = [];
          const totalDiscount = getTotalDiscountDay(breakfastDiscount, lunchDiscount);

          if (totalDiscount.length > 0) {
            const discountData = totalDiscount[0]; // Acceder al primer elemento del arreglo
            
            discountUser.push({
              fecha: daysToCalculate[i],
              Desayuno: discountData.Desayuno,
              Almuerzo: discountData.Almuerzo,
              Total: discountData.Total
            });
          }
        } else {
          if (!breakfatDayClosed && lunchDayClosed) {
            const breakfastDiscount = [];
            const lunchDiscount = await generateDailyDiscount(daysToCalculate[i], 1);
            const totalDiscount = getTotalDiscountDay(breakfastDiscount, lunchDiscount);
            
            if (totalDiscount.length > 0) {
              const discountData = totalDiscount[0]; // Acceder al primer elemento del arreglo
              
              discountUser.push({
                fecha: daysToCalculate[i],
                Desayuno: discountData.Desayuno,
                Almuerzo: discountData.Almuerzo,
                Total: discountData.Total
              });
            }
        }
      }
      }
    }
    if (discountUser.length > 0) {
      console.log(discountUser);
      const title = 'Descuentos del comerdor del ' + daysToCalculate[0] + ' al ' + daysToCalculate[daysToCalculate.length - 1];
      exportToPDF(title +  +'.pdf', title, currentUser.solapin + ': ' + currentUser.nombre, discountUser);
    } else {
      alert('No hay datos disponibles.');
    }
  });

  closeModalBtn.addEventListener("click", function() {
    if (changesMade) {
      const saveChanges = confirm("¿Desea salvar los cambios antes de cerrar?");
      if (saveChanges) {
        saveChangesFunction();
      } else {
        discardChanges();
      }
    }
    calendarModal.style.display = "none";
  });

  saveBtn.addEventListener("click", saveChangesFunction);

  async function saveChangesFunction() {
    const currentDate = new Date(); // Obtener la fecha y hora actual
    const userSolapin = currentUser.solapin; // Obtener el solapin del usuario logueado

    // Filtrar reservas a partir de la fecha actual
    const validBookings = tempBookings.filter(booking => {
        const bookingDate = new Date(currentYear, booking.month, booking.day);
        return bookingDate >= currentDate; // Solo reservas a partir de hoy
    });

    // Guardar las reservas en la tabla correspondiente
    const tableName = modalTitle.textContent === "Reservas de desayunos" ? 'rdesayunos' : 'ralmuerzos';

    // Obtener las fechas existentes en la base de datos
    const existingBookings = modalTitle.textContent === "Reservas de desayunos" ? breakfasts : lunches;
    const existingDates = existingBookings.map(booking => `${currentYear}-${booking.month + 1}-${booking.day}`);
    const newDates = validBookings.map(booking => `${currentYear}-${booking.month + 1}-${booking.day}`);

    // Encontrar las reservas a eliminar solo si son futuras
    const reservationsToDelete = existingBookings.filter(booking => {
        const bookingDate = new Date(currentYear, booking.month, booking.day);
        const bookingDateString = `${currentYear}-${booking.month + 1}-${booking.day}`;
        return bookingDate >= currentDate && !newDates.includes(bookingDateString);
    });

    // Eliminar las reservas que ya no están
    for (const booking of reservationsToDelete) {
        const bookingDateString = `${currentYear}-${booking.month + 1}-${booking.day}`;
        await deleteReservation(tableName, userSolapin, bookingDateString);
    }

    // Guardar las nuevas reservas
    await saveToDatabase(validBookings, tableName, userSolapin);

    // Actualizar las reservas en la variable correspondiente
    if (modalTitle.textContent === "Reservas de desayunos") {
        breakfasts = existingBookings.filter(booking => {
            const bookingDate = new Date(currentYear, booking.month, booking.day);
            return bookingDate < currentDate; // Mantener las reservas pasadas
        }).concat(validBookings); // Agregar las nuevas reservas futuras
    } else {
        lunches = existingBookings.filter(booking => {
            const bookingDate = new Date(currentYear, booking.month, booking.day);
            return bookingDate < currentDate; // Mantener las reservas pasadas
        }).concat(validBookings); // Agregar las nuevas reservas futuras
    }

    // Preguntar al usuario si desea generar un PDF
    const generatePDF = confirm("¿Desea obtener un PDF con sus reservaciones?");
    if (generatePDF) {
        generatePDFReport(modalTitle.textContent === "Reservas de desayunos" ? breakfasts : lunches);
    }

    alert("Cambios guardados exitosamente.");
    changesMade = false;
    saveBtn.disabled = true;
    saveBtn.classList.add('disabled');
}


function generatePDFReport(bookings) {
  const { jsPDF } = window.jspdf; // Asegúrate de incluir jsPDF en tu HTML
  const doc = new jsPDF();

  const title = modalTitle.textContent === "Reservas de desayunos" ? "RESERVAS DESAYUNOS" : "RESERVAS ALMUERZOS";
  const year = new Date().getFullYear(); // Obtener el año actual
  doc.setFontSize(18);
  doc.text(`${title} - ${year}`, 14, 20);

  // Agrupar reservas por mes
  const groupedBookings = {};
  bookings.forEach(booking => {
      const monthName = months[booking.month].name;
      if (!groupedBookings[monthName]) {
          groupedBookings[monthName] = [];
      }
      groupedBookings[monthName].push(booking.day);
  });

  // Crear tabla
  let y = 30;
  doc.setFontSize(12);
  doc.text("Mes", 14, y);
  doc.text("Días Reservados", 100, y);
  y += 10;

  // Dibujar líneas de separación
  doc.setDrawColor(0);
  doc.line(14, y - 5, 195, y - 5); // Línea horizontal

  for (const month in groupedBookings) {
      const days = groupedBookings[month].join("/");
      doc.text(month, 14, y);
      doc.text(days, 100, y);
      y += 10;

      // Dibujar línea de separación para cada fila
      doc.line(14, y - 5, 195, y - 5); // Línea horizontal
  }

  // Guardar el PDF
  doc.save('reservas.pdf');
}

// Función para eliminar una reserva
async function deleteReservation(tableName, solapin, fecha) {
  const response = await fetch(`${config.apiUrl}/delete/${tableName}/${solapin}/${fecha}`, {
      method: 'DELETE'
  });

  if (!response.ok) {
      const errorMessage = await response.json();
      throw new Error(`Error al eliminar la reserva: ${errorMessage.error}`);
  }

  return await response.json();
}

  //***********************************************************  
  // Función para guardar en la base de datos
  async function saveToDatabase(data, tableName, solapin) {
    const currentDate = new Date(); // Obtener la fecha y hora actual

    for (const booking of data) {
        const requestData = {
            solapin: solapin,
            fecha: `${currentYear}-${booking.month + 1}-${booking.day}`, // Formato YYYY-MM-DD
            realizado: currentDate.toISOString().slice(0, 19).replace('T', ' ') // Formato YYYY-MM-DD HH:MM:SS
        };

        // Comprobar si el registro ya existe
        const existsResponse = await fetch(`${config.apiUrl}/check/${tableName}?solapin=${solapin}&fecha=${requestData.fecha}`);
        const exists = await existsResponse.json();

        if (!exists) {
            // Solo insertar si no existe
            await fetch(`${config.apiUrl}/save/${tableName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
        }
    }

    console.log("Datos guardados en la base de datos.");
}
//********************************************************** 
  
  function discardChanges() {
    tempBookings = (modalTitle.textContent === "Reservas de desayunos") ? [...breakfasts] : [...lunches];
  }

  // Función para determinar si un año es bisiesto
  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};
  
function renderCalendar() {
  function parseDateString(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function initializeBlockedDays() {
    const daysToBlock = Cfg[0].daysToBlock;
    const [startDateStr, endDateStr] = daysToBlock.split('/');
    const startDate = parseDateString(startDateStr);
    const endDate = parseDateString(endDateStr);

    let currentDate = new Date(startDate);
    let BlockedDays = [];

    while (currentDate <= endDate) {
      BlockedDays.push({
        month: currentDate.getMonth(),
        day: currentDate.getDate()
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return BlockedDays;
  }

  let BlockedDays = initializeBlockedDays();
  const today = new Date();
  const currentYear = today.getFullYear();

  calendarDiv.innerHTML = '';
  const selectedYear = parseInt(yearSpinbox.value);

  if (isLeapYear(selectedYear)) {
    months[1].days = 29;
  } else {
    months[1].days = 28;
  }

  const selectedDays = {};

  tempBookings.forEach(booking => {
    if (!selectedDays[booking.month]) {
      selectedDays[booking.month] = {};
    }
    selectedDays[booking.month][booking.day] = true;
  });

  for (let i = 0; i < 12; i++) {
    const month = months[i];
    const monthDiv = document.createElement("div");
    monthDiv.classList.add("month");

    const monthNameDiv = document.createElement("div");
    monthNameDiv.classList.add("month-name");
    monthNameDiv.textContent = month.name.toUpperCase();

    monthNameDiv.addEventListener("click", function() {
      const daysDivs = monthDiv.querySelectorAll('.day');
      daysDivs.forEach(dayDiv => {
        if (!dayDiv.classList.contains("no-modify") && !dayDiv.classList.contains("blocked")) {
          toggleDaySelection(i, parseInt(dayDiv.textContent), dayDiv);
        }
      });
    });

    monthDiv.appendChild(monthNameDiv);

    const weekdaysDiv = document.createElement("div");
    weekdaysDiv.classList.add("weekdays");
    const weekdayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    weekdayNames.forEach(weekday => {
      const weekdayDiv = document.createElement("div");
      weekdayDiv.classList.add("weekday");
      weekdayDiv.textContent = weekday;
      weekdaysDiv.appendChild(weekdayDiv);
    });
    monthDiv.appendChild(weekdaysDiv);

    const daysDiv = document.createElement("div");
    daysDiv.classList.add("days");
    let dayCount = 1;

    for (let j = 0; j < 6; j++) {
      for (let k = 0; k < 7; k++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");

        const dateToCheck = new Date(selectedYear, i, dayCount);
        if ((j === 0 && k >= new Date(selectedYear, i, 1).getDay()) || j > 0) {
          if (dayCount <= month.days) {
            dayDiv.textContent = dayCount;

            if (dateToCheck.getDay() === 0 || dateToCheck.getDay() === 6) {
              dayDiv.classList.add("no-modify");
              dayDiv.style.backgroundColor = "#add8e6";
            } else if (holidays.some(holiday => holiday.month === i && holiday.day === dayCount)) {
              dayDiv.classList.add("no-modify");
            } else if (selectedYear === currentYear && dateToCheck < today) {
              dayDiv.classList.add("blocked");
            } 

            if (selectedDays[i] && selectedDays[i][dayCount]) {
              console.log(`Reserva encontrada: Mes ${i}, Día ${dayCount}`);
              dayDiv.classList.add("selected");
            }

            if (BlockedDays.some(blocked => blocked.month === i && blocked.day === dayCount) || dateToCheck < today || isSameWeek(dateToCheck)) {
              dayDiv.classList.add("blocked");
            }

            dayDiv.addEventListener("click", function() {
              toggleDaySelection(i, dayCount, dayDiv);
            });
            dayCount++;
          } else {
            dayDiv.classList.add("no-number");
          }
        } else {
          dayDiv.classList.add("no-number");
        }
        daysDiv.appendChild(dayDiv);
      }
    }
    monthDiv.appendChild(daysDiv);
    calendarDiv.appendChild(monthDiv);
  }
}

function toggleDaySelection(month, day, dayDiv) {
  if (!dayDiv.classList.contains("no-modify") && !dayDiv.classList.contains("blocked")) {
    dayDiv.classList.toggle("selected");
    const selected = dayDiv.classList.contains("selected");
    if (selected) {
      tempBookings.push({ month, day: parseInt(dayDiv.textContent) });
    } else {
      tempBookings = tempBookings.filter(booking => !(booking.month === month && booking.day === parseInt(dayDiv.textContent)));
    }
    changesMade = true;
    saveBtn.disabled = false;
    saveBtn.classList.remove('disabled');
  }
}

function isSameWeek(date) {
  const today = new Date();
  // Obtenemos el primer y último día de la semana actual
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

  // Regenerar el objeto `today` para evitar modificar el original
  today.setDate(today.getDate() + today.getDay()); // Volver al valor original de today

    // Comprobar si la fecha está dentro del rango de la semana
  const isInWeek = date >= firstDayOfWeek && date <= lastDayOfWeek;

  return isInWeek;
}


  
});
