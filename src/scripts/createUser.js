const { sequelize, User } = require('../models');

/* This code block is using an asynchronous function in JavaScript to interact with a database using
Sequelize ORM. Here's a breakdown of what it's doing: */
(async () => {
  await sequelize.sync();
  const user = await User.create({
    username: 'luiza',
    password: 'luvaldes08',
    role: 'admin'
  });
  console.log('✅ Usuario creado:', user.username);
  process.exit();
})();