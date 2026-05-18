const { Op } = require('sequelize');

const normalizeStatusName = (name = '') => String(name || '').toLowerCase().trim();

const isSessionConsumingStatusName = (name = '') => {
    const value = normalizeStatusName(name);

    if (!value) return true;
    if (value.includes('cancel')) return false;
    if (value.includes('inasist')) return false;
    if (value.includes('no') && (value.includes('show') || value.includes('asist'))) return false;

    return true;
};

const getNonConsumingQuoteStatusIds = async (StatusQuotes, transaction = null) => {
    const statuses = await StatusQuotes.findAll({ attributes: ['id', 'nombre'], transaction });

    return statuses
        .filter((status) => !isSessionConsumingStatusName(status.nombre))
        .map((status) => status.id);
};

const buildConsumingQuoteWhere = (nonConsumingStatusIds = []) => {
    if (!Array.isArray(nonConsumingStatusIds) || nonConsumingStatusIds.length === 0) return {};

    return {
        id_estado_citas: {
            [Op.notIn]: nonConsumingStatusIds
        }
    };
};

module.exports = {
    isSessionConsumingStatusName,
    getNonConsumingQuoteStatusIds,
    buildConsumingQuoteWhere
};
