//Importar Express
const express = require('express');

// Carga las rutas del Proyecto
const patient = require('./routes/patient.route');
const appointment = require('./routes/appointment.route');
const errorHandler = require('./middlewares/errorHandler.middleware');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(errorHandler);

//Cargar las rutas
app.use('/patient',patient);
app.use('/appointment',appointment);

module.exports = app;