// Objetivo del archivo Levantar el servidor y cargar las rutas
// Este archivo es el punto de entrada de la aplicación, donde se configura el servidor y se
// Cargan los env
const dotenv = require('dotenv');

// Carga las rutas y express
const app = require('./routes.js');
const { sequelize } = require('./models');


dotenv.config();

// Validación del puerto
const port = process.env.PORT || 3000;


/**
 * The function `startServer` establishes a connection to a database using Sequelize, synchronizes
 * tables, and starts a server listening on a specified port.
 */
async function startServer() {
  try {
    console.log("URL DB:",process.env.DATABASE_URL);
    await sequelize.authenticate(); // Verifica conexión
    await sequelize.sync();         // Crea tablas si no existen
  // await sequelize.sync({ alter: true }).then(() => {
  //   console.log('Base de datos actualizada (alter: true)');
  //   });


    console.log('✅ Conexión establecida y tablas sincronizadas.');

    app.listen(port, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
}

startServer();