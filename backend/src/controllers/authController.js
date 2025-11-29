const User = require("../models/User");
const jwt = require("jsonwebtoken"); // Asegúrate de tener: npm install jsonwebtoken

const SECRET = "secreto_super_seguro"; // En prod usar process.env

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save();
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: "El usuario ya existe o datos inválidos" });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    // Creamos un token simple
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET);
    
    res.json({ success: true, token, username: user.username, favorites: user.favorites, history: user.history });
};

exports.getProfile = async (req, res) => {
    // Middleware simulado: extraemos usuario del header Authorization
    const token = req.headers.authorization?.split(" ")[1];
    if(!token) return res.status(401).json({error: "No token"});

    try {
        const decoded = jwt.verify(token, SECRET);
        const user = await User.findById(decoded.id);
        res.json(user);
    } catch(e) {
        res.status(401).json({error: "Token inválido"});
    }
};

// Actualizar historial/favoritos
exports.updateUser = async (req, res) => {
    const { username, historyItem, favoriteId } = req.body;
    const user = await User.findOne({ username });
    
    if(historyItem) user.history.push(historyItem);
    if(favoriteId) {
        if(!user.favorites.includes(favoriteId)) user.favorites.push(favoriteId);
    }
    
    await user.save();
    res.json({ success: true });
}