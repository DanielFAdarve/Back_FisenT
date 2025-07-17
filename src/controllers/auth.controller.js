const jwt = require('jsonwebtoken');
const { User } = require('../models');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'daniel';

module.exports = {
  async login(req, res) {
    const { username, password } = req.body;

    try {
      if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña obligatorios' });
      }

      const user = await User.findOne({ where: { username } });

      if (!user) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }

      const isValid = await user.validPassword(password);

      if (!isValid) {
        return res.status(401).json({ message: 'Contraseña incorrecta' });
      }

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

  verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }
};
