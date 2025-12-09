//Importar Express
const express = require('express');
const cors = require('cors');

// Carga las rutas del Proyecto
const patient = require('./routes/patient.route');
const packages = require('./routes/packages.route');
const quotes = require('./routes/quotes.route');
const appointment = require('./routes/appointment.route');
const historyquotes = require('./routes/historyquote.route');
const paymentsRoutes = require('./routes/payment.route');
const professionalRoutes = require('./routes/professional.route');

//Cargamos el swagger 
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger/swagger');

const errorHandler = require('./middlewares/errorHandler.middleware');
const cookieParser = require('cookie-parser');
const auth = require('./routes/auth.route');
const app = express();


const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://fisencare.com'
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', auth);
app.use('/patient',patient);

app.use('/packages',packages);
app.use('/quotes',quotes);
app.use('/history',historyquotes);
app.use('/payments', paymentsRoutes);
app.use('/professionals', professionalRoutes);
module.exports = app;