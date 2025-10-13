//Citas service

const { Quotes,Professional, StatusQuotes, Packages } = require('../models');


class QuotesService {

    async getAllQuotes() {

        let infoQuotes = await Quotes.findAll(
            {
                include: [
                    { model: Professional, as: 'Professional' },
                    { model: StatusQuotes, as: 'StatusQuotes' },
                    { model: Packages, as: 'Packages' },
                ]
            });

        if (infoQuotes.length < 1) {
            return 'No hay citas registradas';
        }

        const data = infoQuotes.map((dataQuotes) => {
            return {
                id: dataQuotes.id,
                id_estado_citas: dataQuotes.id_estado_citas,
                id_profesional: dataQuotes.id_profesional,
                id_paquetes: dataQuotes.id_paquetes,
            }
        });

        return data;
    }

   /**
    * The function `createQuote` asynchronously creates a new quote with the provided data, throwing an
    * error if required data is missing.
    * @param data - The `data` parameter is an object that contains the following properties:
    * @returns The `createQuote` function is returning the result of creating a new quote using the
    * `Quotes.create(data)` method. This method likely creates a new quote record in a database or data
    * store based on the provided `data` object. If the required data fields (`id_estado_citas`,
    * `id_profesional`, `id_paquetes`, `fecha_agendamiento`) are not present in
    */
    async createQuote(data) {
        if (!data.id_estado_citas || !data.id_profesional || !data.id_paquetes || !data.fecha_agendamiento) {
            throw new Error('Faltan datos requeridos para crear la cita');
        }

        return await Quotes.create(data);
    }

   /**
    * The function `updateQuotes` asynchronously updates a quote record in a database based on the
    * provided ID and data.
    * @param id - The `id` parameter is the unique identifier of the quote that you want to update in
    * the database.
    * @param data - The `data` parameter in the `updateQuotes` function likely refers to an object
    * containing the new values that you want to update in the database record identified by the `id`.
    * This object would typically include key-value pairs where the keys correspond to the fields in
    * the database record that you want to update
    * @returns the result of updating the quotes record with the provided data.
    */
    async updateQuotes(id, data) {
        const QuotesRecord = await Quotes.findOne({ where: { id } });
        if (!QuotesRecord) {
            throw new Error('Cita no encontrada');
        }
        return await QuotesRecord.update(data);

    }

    /**
     * The function `deleteQuotes` asynchronously deletes a quote record based on the provided ID after
     * checking its existence.
     * @param id - The `id` parameter is the unique identifier of the quote that you want to delete
     * from the database.
     * @returns The `deleteQuotes` function is returning the result of the `destroy()` method called on
     * the `QuotesRecord`. This method deletes the record from the database and returns a promise that
     * resolves to the deleted record.
     */
    async deleteQuotes(id) {
        const QuotesRecord = await Quotes.findOne({ where: { id } });
        if (!QuotesRecord) {
            throw new Error('Cita no encontrada');
        }
        return await QuotesRecord.destroy();
    }

}

module.exports = new QuotesService();
