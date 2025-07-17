// models/User.js
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

class User extends Model {
    static initModel(sequelize) {
        User.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                username: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                    unique: true,
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                role: {
                    type: DataTypes.STRING(20),
                    defaultValue: 'user'
                }
            },
            {
                sequelize,
                modelName: 'User',
                tableName: 'usuarios',
                timestamps: false,
                hooks: {
                    beforeCreate: async (user) => {
                        if (user.password) {
                            const salt = await bcrypt.genSalt(10);
                            user.password = await bcrypt.hash(user.password, salt);
                        }
                    },
                    beforeUpdate: async (user) => {
                        if (user.changed('password')) {
                            const salt = await bcrypt.genSalt(10);
                            user.password = await bcrypt.hash(user.password, salt);
                        }
                    },
                }
            }
        );
    }

    validPassword(password) {
        return bcrypt.compare(password, this.password);
    }
}

module.exports = User;
