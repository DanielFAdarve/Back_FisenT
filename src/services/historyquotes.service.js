/* The HistoryquotesService class provides methods for managing history quotes related to patient
appointments and medical codes. */
//Citas service

const { HistoryQuote, Quotes, Cie10 } = require('../models');


class HistoryquotesService {
    /**
     * The function `getAllHistoryquotes` retrieves all history quotes including associated quotes and
     * Cie10 codes, returning relevant data if available.
     * @returns The `getAllHistoryquotes` function returns an array of objects containing information about
     * history quotes. Each object includes the following properties: `id`, `id_cita`, `id_cie`,
     * `estado_paciente`, and `recomendaciones`. If there are no history quotes found, it returns the
     * string 'No hay historia registrada'.
     */

    async getAllHistoryquotes() {

        let infoHistoryquotes = await HistoryQuote.findAll(
            {
                include: [
                    { model: Quotes, as: 'Quotes' },
                    { model: Cie10, as: 'Cie10' },
                ]
            });

        if (infoHistoryquotes.length < 1) {
            return 'No hay historia registrada';
        }

        const data = infoHistoryquotes.map((dataHistoryquotes) => {
            return {
                id: dataHistoryquotes.id,
                id_cita: dataHistoryquotes.id_cita,
                id_cie: dataHistoryquotes.id_cie,
                estado_paciente: dataHistoryquotes.descripcion_estado_paciente,
                recomendaciones: dataHistoryquotes.recomendaciones,
                //Preguntar si la descripción del estado paciente y recomendaciones deben estar acá?
            }
        });

        return data;
    }

    /**
     * The function `createHistoryquotes` asynchronously creates a history quote record with the provided
     * data, throwing an error if required data is missing.
     * @param data - The `data` parameter in the `createHistoryquotes` function likely contains
     * information needed to create a new history quote. This data may include fields such as `id_cita`
     * and `id_cie`, which are required for creating the history quote. If any of these required fields
     * are missing in
     * @returns The `createHistoryquotes` function is returning the result of the
     * `HistoryQuote.create(data)` function call. This function is creating a new history quote record in
     * the database based on the provided `data` object. The function is using `async/await` syntax to
     * handle asynchronous operations and ensure that the result of the `HistoryQuote.create(data)` call
     * is returned once it is resolved.
     */
    async createHistoryquotes(data) {
        if (!data.id_cita || !data.id_cie) {
            throw new Error('Faltan datos requeridos para crear la historia');
        }

        return await HistoryQuote.create(data);
    }

    /**
     * The function `updateHistoryquotes` updates a history quote record with the provided data if it
     * exists, otherwise throws an error.
     * @param id - The `id` parameter is used to specify the unique identifier of the history quote
     * record that you want to update. It is typically a numeric or alphanumeric value that uniquely
     * identifies the record in the database.
     * @param data - The `data` parameter in the `updateHistoryquotes` function likely represents the
     * new information that you want to update in the history quotes record with the specified `id`.
     * This data could include key-value pairs where the keys correspond to the fields in the history
     * quotes record that you want to update, and
     * @returns the result of updating the history quote record with the provided data.
     */
    async updateHistoryquotes(id, data) {
        const HistoryquotesRecord = await HistoryQuote.findOne({ where: { id } });
        if (!HistoryquotesRecord) {
            throw new Error('Historia no encontrada');
        }
        return await HistoryquotesRecord.update(data);

    }

    /**
     * The function `deleteHistoryquotes` asynchronously deletes a history quote record based on the
     * provided ID.
     * @param id - The `id` parameter is the unique identifier of the history quote record that you want
     * to delete from the database. This function uses the `id` to find the specific history quote record
     * to be deleted.
     * @returns The `deleteHistoryquotes` function is returning the result of the `destroy` method called
     * on the `HistoryquotesRecord`. This method deletes the record from the database and returns a
     * promise that resolves to the deleted record.
     */
    async deleteHistoryquotes(id) {
        const HistoryquotesRecord = await HistoryQuote.findOne({ where: { id } });
        if (!HistoryquotesRecord) {
            throw new Error('Historia no encontrada');
        }
        return await HistoryquotesRecord.destroy();
    }

}

module.exports = new HistoryquotesService();
