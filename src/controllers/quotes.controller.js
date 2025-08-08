const response = require('../models/Response.models')
const quotesService = require('../services/quotes.service');

const getAllQuotes = async (req, res) => {
    try {
        const quotes = await quotesService.getAllQuotes();
         res.status(200).send(response.set(200, 'Consultada la informacion de las citas',quotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al obtener citas'));
    }
}


const createQuotes = async (req, res) => {
    try {
        const quotesData = req.body;
        const quotes = await quotesService.createQuote(quotesData);
         res.status(200).send(response.set(200, 'Se creo la cita',quotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al crear la cita'));
    }
}



const updateQuotes = async (req, res) => {
    try {
        const quotesId = req.params.id;
        if (!quotesId) {
            return res.status(400).send(response.set(400, 'ID de cita es requerido'));
        }
        const quotesData = req.body;
        const quotes = await quotesService.updateQuotes(quotesId,quotesData);
         res.status(200).send(response.set(200, 'Se actualizo la cita',quotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al actualizar cita'));
    }
}


const deleteQuotes = async (req, res) => {
    try {
        const quotesId = req.params.id;
        if (!quotesId) {
            return res.status(400).send(response.set(400, 'ID de cita es requerido'));
        }
        const quotes = await quotesService.deleteQuotes(quotesId);
         res.status(200).send(response.set(200, 'Se Elimino la cita',quotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al eliminar cita'));
    }
}

module.exports = {
    getAllQuotes,
    createQuotes,
    updateQuotes,
    deleteQuotes
}