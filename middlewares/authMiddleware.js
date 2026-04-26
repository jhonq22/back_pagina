// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. Se requiere un token de autenticación.' });
    }

    // --- LÍNEAS DE DIAGNÓSTICO ---
    console.log("1. Token recibido:", token);
    console.log("2. Llave secreta disponible:", !!process.env.JWT_SECRET);
    // -----------------------------

    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado;
        next();
    } catch (error) {
        // --- DIAGNÓSTICO DEL FALLO ---
        console.log("3. Motivo del fallo de validación:", error.message);
        return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
    }
};

module.exports = verificarToken;