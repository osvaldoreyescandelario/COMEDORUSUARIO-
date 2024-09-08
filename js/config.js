var config = {
    apiUrl: 'http://localhost:3000/api'
};

// Dias festivos, feriados o cualquier otro dia  que no se trabaje 
// y por lo tanto no se puede reservar
const holidays = [
    { month: 0, day: 1 },
    { month: 0, day: 2 },
    { month: 2, day: 29 },
    { month: 4, day: 1 },
    { month: 6, day: 25 },
    { month: 6, day: 26 },
    { month: 6, day: 27 },
    { month: 9, day: 10 },
    { month: 11, day: 25 },
    { month: 11, day: 31 }
  ];

  let Cfg = [
    { daysToBlock: '2024-08-05/2024-08-09' },
    { news: 'Ya no se puede reservar para la próxima semana' },
    { active: 0 }
];

// Variable global para almacenar los datos del usuario
let currentUser = null;