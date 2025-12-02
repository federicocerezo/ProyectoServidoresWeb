const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Usar variable de entorno
const SECRET = process.env.JWT_SECRET || "secreto_inseguro_por_defecto";

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ id: newUser._id, username: newUser.username }, SECRET);

        res.json({ 
            success: true, 
            token, 
            username: newUser.username, 
            favorites: newUser.favorites || [], 
            history: newUser.history || []
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "El usuario ya existe o datos inválidos" });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET);
    
    res.json({ success: true, token, username: user.username, favorites: user.favorites, history: user.history });
};

exports.getProfile = async (req, res) => {
    // El middleware 'verifyToken' ya se aseguró de que req.user existe.
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
        
        // No devolvemos la contraseña
        const { password, ...userData } = user.toObject();
        res.json(userData);
    } catch(e) { 
        res.status(500).json({error: "Error del servidor"}); 
    }
};

exports.updateUser = async (req, res) => {
    // Usamos el username del token para más seguridad
    const { username, historyItem, favoriteId } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "Usuario no existe" });

    if(historyItem) user.history.push(historyItem);
    if(favoriteId) {
        if(!user.favorites.includes(favoriteId)) user.favorites.push(favoriteId);
        else user.favorites = user.favorites.filter(id => id !== favoriteId); 
    }
    await user.save();
    res.json({ success: true });
}