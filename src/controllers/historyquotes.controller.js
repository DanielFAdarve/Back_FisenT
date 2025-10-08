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


/**
 * The function `createHistoryquotes` handles the creation of historical quotes data and sends a
 * response based on the outcome.
 * @param req - The `req` parameter in the `createHistoryquotes` function typically represents the HTTP
 * request object, which contains information about the incoming request from the client, such as
 * headers, parameters, body content, etc. In this specific context, `req.body` is likely used to
 * access the data sent in
 * @param res - The `res` parameter in the `createHistoryquotes` function is the response object that
 * is used to send a response back to the client making the request. It is typically provided by the
 * Express.js framework in Node.js applications and contains methods for sending HTTP responses. In
 * this function, `res`
 */
const createHistoryquotes = async (req, res) => {
    try {
        const historyquotesData = req.body;
        const historyquotes = await historyquotesService.createHistoryquotes(historyquotesData);
         res.status(200).send(response.set(200, 'Se creo la historia',historyquotes));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al crear la historia'));
    }
}


/**
 * The function `updateHistoryquotes` is an asynchronous function that updates a history quote based on
 * the provided ID and data, handling errors and sending appropriate responses.
 * @param req - The `req` parameter in the `updateHistoryquotes` function is an object representing the
 * HTTP request. It contains information about the request made to the server, such as the request
 * parameters, body, headers, and more. In this function, `req` is used to extract the `id`
 * @param res - The `res` parameter in the `updateHistoryquotes` function is the response object that
 * will be sent back to the client making the request. It is used to send the HTTP response with the
 * status code and data back to the client.
 * @returns If the `historyquotesId` is not provided in the request parameters, a response with status
 * code 400 and a message indicating that the ID is required will be returned.
 */

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


/**
 * The function `deleteHistoryquotes` deletes a history quote based on the provided ID and sends a
 * response with the outcome.
 * @param req - The `req` parameter in the `deleteHistoryquotes` function is an object representing the
 * HTTP request. It contains information about the request made to the server, such as the request
 * headers, parameters, body, and more. In this function, `req.params.id` is used to extract the `
 * @param res - The `res` parameter in the `deleteHistoryquotes` function is the response object that
 * is used to send a response back to the client making the request. It is typically provided by the
 * Express.js framework in Node.js applications. The `res` object has methods like `res.status()` and `
 * @returns The `deleteHistoryquotes` function is returning a response based on the outcome of deleting
 * a history quote. If the `historyquotesId` is not provided in the request parameters, it will return
 * a 400 status with a message indicating that the ID is required. If the deletion is successful, it
 * will return a 200 status with a success message and the deleted history quote. If an error occurs
 */
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