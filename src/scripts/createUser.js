const { sequelize, User } = require('../models');

(async () => {
  await sequelize.sync();
  const user = await User.create({
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  });
  console.log('✅ Usuario creado:', user.username);
  process.exit();
})();