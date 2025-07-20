const jwt = require('jsonwebtoken');
const { User } = require('../models');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'daniel';

module.exports = {
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
  },


};
