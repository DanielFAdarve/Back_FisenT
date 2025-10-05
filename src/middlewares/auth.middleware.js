const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'daniel';

/**
 * The function `verifyToken` checks for a valid token in the request headers and verifies it using a
 * secret key before allowing access to the next middleware.
 * @param req - The `req` parameter in the `verifyToken` function stands for the request object. It
 * contains information about the HTTP request that comes from the client, such as headers, parameters,
 * body, etc. In this case, the function is extracting the authorization token from the request headers
 * to verify the user
 * @param res - The `res` parameter in the `verifyToken` function is the response object in Express.js.
 * It is used to send a response back to the client making the request. In the provided code snippet,
 * `res` is used to send a JSON response with an appropriate status code and message if certain
 * @param next - The `next` parameter in the `verifyToken` function is a callback function that is used
 * to pass control to the next middleware function in the stack. When called, it passes the control to
 * the next middleware function. This is commonly used in Express.js middleware functions to move to
 * the next function in
 * @returns If the token is not provided, a response with status code 401 and a JSON object containing
 * the message 'Token no proporcionado' is being returned. If the token is invalid, a response with
 * status code 403 and a JSON object containing the message 'Token inválido' is being returned. If the
 * token is valid, the user object decoded from the token is attached to the request object and
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });

    req.user = user;
    next();
  });
};

module.exports = {
  verifyToken
};