const authService = require('../services/auth.service');

const getConnectionParams = (invoicePrefix) => {

    connectionParams = {
        "CASM":{
            "officeId":"17",
            "companyId":"1"
        },
        "ACM":{
            "officeId":"8",
            "companyId":"1"
        },
        "DIAC":{
            "officeId":"24",
            "companyId":"709862"
        },
        "V":{
            "officeId":"9",
            "companyId":"329436"
        },
        "ACI":{
            "officeId":"3",
            "companyId":"1"
        }
    }

    console.log(connectionParams[invoicePrefix]);
    
    return connectionParams[invoicePrefix] || {
        "officeId":"8",
        "companyId":"1"
    };
};

const getSessionCookie = async (invoicePrefix) => {
    try {
        console.log('Generando Cookies');
        const connectionParams = getConnectionParams(invoicePrefix);
        const session = await authService.updateSession(connectionParams);
        const originalCookies = session.headers['set-cookie'];

        if (!originalCookies || originalCookies.length === 0) {
            throw new Error('La respuesta no entrego las cookies');
        }

        const newCookies = originalCookies.map(cookie => {
            if (cookie.includes('Domain=')) {
                return cookie.replace(/Domain=[^;]+/, 'Domain=weliiavidanti.gomedisys.com');
            } else {
                return `${cookie}; Domain=weliiavidanti.gomedisys.com`;
            }
        });

        const allCookies = [...originalCookies, ...newCookies];

        console.log('Se crearon las cookies para los dos dominios');

        return allCookies;

    } catch (error) {
        console.error('Failed to create new session:', error.message);
        throw { status: 401, message: 'Unauthorized. Failed to generate a new session.' };
    }
};

const authMiddleware = async (req, res, next) => {
    try {
        const newCookie = await getSessionCookie();
        res.clearCookie('authSession');
        res.cookie('authSession', newCookie, { httpOnly: true, secure: true });
        req.sessionCookie = newCookie;
        next();
    } catch (error) {
        return res.status(error.status || 500).json({ success: false, message: error.message });
    }
};

module.exports = { authMiddleware, getSessionCookie };