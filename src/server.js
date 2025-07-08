// Objetivo del archivo Levantar el servidor y cargar las rutas
// Este archivo es el punto de entrada de la aplicación, donde se configura el servidor y se
// Cargan los env
const dotenv = require('dotenv');

// Carga las rutas y express
const app = require('./routes.js');
const express = require('express');

dotenv.config();

// Validación del puerto
const port = process.env.PORT || 3000;


app.listen(port, () => {
    console.log(`Proyecto Corriendo en:  http://localhost:${port}`);
});
 