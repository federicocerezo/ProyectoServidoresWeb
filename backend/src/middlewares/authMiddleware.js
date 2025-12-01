const jwt = require("jsonwebtoken");

// Usamos la variable de entorno. Si falla, usa un string temporal (solo para desarrollo)
const SECRET = process.env.JWT_SECRET || "secreto_inseguro_por_defecto";

const verifyToken = (req, res, next) => {
    // 1. Buscamos el token en el header Authorization
    const authHeader = req.headers['authorization'];
    // El formato suele ser "Bearer TOKEN_AQUI"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: "Acceso denegado. No se proporcionó token." 
        });
    }

    try {
        // 2. Verificamos el token
        const verified = jwt.verify(token, SECRET);
        
        // 3. Inyectamos los datos del usuario en la request para usarlos después
        req.user = verified; 
        
        // 4. Continuamos a la siguiente función (el controlador)
        next(); 
    } catch (error) {
        res.status(403).json({ 
            success: false, 
            error: "Token inválido o expirado." 
        });
    }
};

module.exports = verifyToken;