const { Pool } = require('pg');
const XLSX = require('xlsx');
// Configuración conexión PG (ajusta con tus datos reales)
const pool = new Pool({
    user: 'postgres',
    host: '20.231.87.17',
    database: 'ZentriaPr',
    password: 'y6?/s,Z;aN{A6USb',
    port: 5432,
});

function excelDateToJSDate(excelDate) {
  // Excel cuenta desde 1900-01-01 (día 1)
  const jsDate = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
  return jsDate;
}
/**
 * Consulta todos los registros de la tabla devoluciones
 * @param {object} params - si quieres agregar filtros, lo puedes usar (opcional)
 * @returns {Promise<Array>} - Array con las filas de la tabla devoluciones
 */
const getDevolution = async (params = {}) => {
    try {
        const client = await pool.connect();

        // Consulta simple: todos los registros
        const res = await client.query('SELECT * FROM devoluciones');

        client.release();

        // Devuelve el arreglo de filas
        return res.rows;

    } catch (error) {
        console.error('Error consultando devoluciones:', error);
        throw error;
    }
};

/**
 * Recibe archivo en base64, lo parsea y guarda filas en la tabla devoluciones
 * @param {string} base64File - Archivo codificado en base64 (Excel .xlsx)
 * @returns {Promise<number>} Número de filas insertadas
 */
const uploadDevolutionsFromBase64 = async (base64File) => {
    try {
        // Quitar encabezado si viene con data url: data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,...
        const base64Data = base64File.includes(',') ? base64File.split(',')[1] : base64File;

        // Decodificar base64 a buffer
        const fileBuffer = Buffer.from(base64Data, 'base64');

        // Leer workbook
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Asumimos que los datos están en la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir hoja a JSON
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
            throw new Error('Archivo sin datos');
        }

        // Conexión a DB
        const client = await pool.connect();

        try {
            // Empezar transacción
            await client.query('BEGIN');

            // Insertar fila por fila (mejor hacerlo con batch pero aquí ejemplo sencillo)
            for (const row of rows) {
                const queryText = `
                    INSERT INTO devoluciones(no_factura, fecha_devolucion, cod_devolucion, observacion)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `;

                const fechaJS = excelDateToJSDate(row.fecha_devolucion);

                await client.query(queryText, [
                    row.no_factura,
                    fechaJS,
                    row.cod_devolucion,
                    row.observacion
                ]);
            }
            // Confirmar
            await client.query('COMMIT');
            return rows.length;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error subiendo devoluciones desde base64:', error);
        throw error;
    }
};

module.exports = { getDevolution, uploadDevolutionsFromBase64 };