/**
 * The errorHandler function logs the error stack trace and sends a 500 status response with a JSON
 * object containing a message about the error.
 * @param err - The `err` parameter in the `errorHandler` function represents the error object that is
 * passed to the function when an error occurs during the execution of a request. This object contains
 * information about the error, such as the error message, stack trace, and other relevant details. The
 * function uses this parameter
 * @param req - The `req` parameter in the `errorHandler` function stands for the request object. It
 * contains information about the HTTP request that triggered the error, such as headers, parameters,
 * body, and more. This object is typically used to access data sent by the client to the server.
 * @param res - The `res` parameter in the `errorHandler` function represents the response object in
 * Express.js. It is used to send a response back to the client making the request. In the provided
 * code snippet, `res.status(500)` is setting the HTTP status code to 500 (Internal Server Error
 * @param next - The `next` parameter in the `errorHandler` function is a reference to the next
 * middleware function in the application's request-response cycle. It is a callback function that is
 * used to pass control to the next middleware function in the stack. If an error occurs in the current
 * middleware function, you can
 */
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Error interno del servidor' });
};

module.exports = errorHandler;

