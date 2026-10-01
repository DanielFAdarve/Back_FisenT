const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

const MIGRATIONS = [
    '20261001_add_training_session_history.sql'
];

const runMigrations = async () => {
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name VARCHAR(255) PRIMARY KEY,
            executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    for (const name of MIGRATIONS) {
        const [executed] = await sequelize.query(
            'SELECT 1 FROM schema_migrations WHERE name = :name',
            { replacements: { name }, type: QueryTypes.SELECT }
        );

        if (executed) continue;

        const migrationPath = path.join(__dirname, '../../db/migrations', name);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await sequelize.transaction(async (transaction) => {
            await sequelize.query(sql, { transaction });
            await sequelize.query(
                'INSERT INTO schema_migrations (name) VALUES (:name)',
                { replacements: { name }, transaction }
            );
        });
    }
};

module.exports = { runMigrations };
