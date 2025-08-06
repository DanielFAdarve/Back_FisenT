//Importar Express
const express = require('express');
const cors = require('cors');

// Carga las rutas del Proyecto
const patient = require('./routes/patient.route');
const packages = require('./routes/packages.route');
const appointment = require('./routes/appointment.route');
const errorHandler = require('./middlewares/errorHandler.middleware');
const cookieParser = require('cookie-parser');
const auth = require('./routes/auth.route');
const app = express();


const allowedOrigins = [
    'http://localhost:4200',
  ];
  
app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true
  }));



app.use(express.json());
app.use(cookieParser());
app.use(errorHandler);



//Cargar las rutas
app.use('/auth', auth);
app.use('/patient',patient);
app.use('/appointment',appointment);
app.use('/packages',packages);
module.exports = app;