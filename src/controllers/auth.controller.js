const jwt = require('jsonwebtoken');
const { User } = require('../models');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'daniel';

module.exports = {

  /**
   * The async login function handles user authentication by validating credentials, checking for user
   * existence, verifying password, and generating a JWT token for authorization.
   * @param req - The `req` parameter in the `async login` function is typically an object representing
   * the HTTP request. It contains information about the request made to the server, such as the
   * request headers, body, parameters, and more. In this specific function, `req.body` is used to
   * extract the `
   * @param res - The `res` parameter in the `async login` function is the response object that will be
   * used to send the response back to the client making the request. It is typically provided by the
   * Express.js framework when handling HTTP requests. The `res` object has methods like
   * `res.status()`, `
   * @returns The login function returns a JSON response with a token if the login process is
   * successful. If there are any errors during the process, it will return an appropriate error
   * message with the corresponding status code.
   */
  async login(req, res) {
    const { username, password } = req.body;

    try {
        //Valida que lleguen los datos necesarios
      if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña obligatorios' });
      }

        // Busca el usuario en la base de datos
      console.log("Buscar usuario para auth")
      const user = await User.findOne({ where: { username } });

        // Si no se encuentra el usuario, retorna un error
      if (!user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

        // Valida la contraseña
      const isValid = await user.validPassword(password);

        // Si la contraseña es incorrecta, retorna un error
      if (!isValid) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }

        // Genera un token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '2h' }
      );

      return res.json({ token });

    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  }


};
