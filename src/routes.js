//Importar Express y las rutas
const express = require('express');

// Carga las rutas del Proyecto
const devolution = require('./routes/devolution.routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(errorHandler);

app.use('/',devolution);

module.exports = app;