const express = require('express');
const patientController = require('../controllers/patient.controller');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Patient
 *   description: Endpoints para gestión de pacientes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - documentType
 *         - documentNumber
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del paciente
 *           example: 1
 *         firstName:
 *           type: string
 *           description: Primer nombre
 *           example: Juan
 *         lastName:
 *           type: string
 *           description: Apellido
 *           example: Pérez
 *         documentType:
 *           type: string
 *           description: Tipo de documento
 *           example: CC
 *         documentNumber:
 *           type: string
 *           description: Número de documento
 *           example: 1234567890
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento
 *           example: 1990-05-15
 *         phone:
 *           type: string
 *           description: Número de teléfono
 *           example: 3001234567
 *         email:
 *           type: string
 *           description: Correo electrónico
 *           example: juan.perez@example.com
 */

/**
 * @swagger
 * /patient/get-patients:
 *   get:
 *     summary: Obtiene toda la información de los pacientes
 *     description: Devuelve una lista de todos los pacientes registrados en el sistema.
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pacientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Patient'
 */
router.get('/get-patients', patientController.getAllPatients);

/**
 * @swagger
 * /patient/get-patient/{id}:
 *   get:
 *     summary: Obtiene un paciente por su ID
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Paciente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/get-patient/:id', patientController.getPatientById);

/**
 * @swagger
 * /patient/get-patient-by-doc/{id}:
 *   get:
 *     summary: Obtiene un paciente por número de documento
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de documento del paciente
 *     responses:
 *       200:
 *         description: Paciente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/get-patient-by-doc/:id', patientController.getPatientByDocument);

/**
 * @swagger
 * /patient/create-patient:
 *   post:
 *     summary: Crea un nuevo paciente
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Paciente creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 */
router.post('/create-patient', patientController.create);

/**
 * @swagger
 * /patient/update-patient/{id}:
 *   put:
 *     summary: Actualiza un paciente existente
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Paciente actualizado correctamente
 */
router.put('/update-patient/:id', patientController.updatePatient);

/**
 * @swagger
 * /patient/delete-patient/{id}:
 *   delete:
 *     summary: Elimina un paciente
 *     tags: [Patient]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Paciente eliminado correctamente
 */
router.delete('/delete-patient/:id', patientController.deletePatient);

module.exports = router;
