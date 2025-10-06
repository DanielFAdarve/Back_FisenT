const response = require('../models/Response.models')
const historyquotesService = require('../services/historyquotes.service');

/**
 * The function `getAllHistoryquotes` retrieves all history quotes and sends a response with the
 * retrieved data or an error message.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is used to handle incoming requests to
 * the `getAllHistoryquotes` function
 * @param res - The `res` parameter in the code snippet refers to the response object in an Express.js
 * route handler function. It is used to send a response back to the client making the request. In this
 * case, `res` is used to send HTTP responses with status codes and data.
 */
const getAllHistoryquotes = async (req, res) => {
    try {
        const historyquotes = await historyquotesService.getAllHistoryquotes();
         res.status(200).send(response.set(200, 'Consultada la informacion de las historias',historyquotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al obtener la historia'));
    }
}


const createHistoryquotes = async (req, res) => {
    try {
        const historyquotesData = req.body;
        const historyquotes = await historyquotesService.createHistoryquotes(historyquotesData);
         res.status(200).send(response.set(200, 'Se creo la historia',historyquotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al crear la historia'));
    }
}



const updateHistoryquotes = async (req, res) => {
    try {
        const historyquotesId = req.params.id;
        if (!historyquotesId) {
            return res.status(400).send(response.set(400, 'ID de la historia es requerido'));
        }
        const historyquotesData = req.body;
        const historyquotes = await historyquotesService.updateHistoryquotes(historyquotesId,historyquotesData);
         res.status(200).send(response.set(200, 'Se actualizo la historia',historyquotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al actualizar la historia'));
    }
}


const deleteHistoryquotes = async (req, res) => {
    try {
        const historyquotesId = req.params.id;
        if (!historyquotesId) {
            return res.status(400).send(response.set(400, 'ID de historia es requerido'));
        }
        const historyquotes = await historyquotesService.deleteHistoryquotes(historyquotesId);
         res.status(200).send(response.set(200, 'Se Elimino la historia',historyquotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al eliminar la historia'));
    }
}

module.exports = {
    getAllHistoryquotes,
    createHistoryquotes,
    updateHistoryquotes,
    deleteHistoryquotes
}