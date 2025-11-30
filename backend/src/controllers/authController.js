const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET = "secreto_super_seguro"; 

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 2. Crear usuario
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        // 3. NUEVO: Generar Token inmediatamente (Auto-login)
        const token = jwt.sign({ id: newUser._id, username: newUser.username }, SECRET);

        // 4. Devolver éxito + Token + Datos
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
    const token = req.headers.authorization?.split(" ")[1];
    if(!token) return res.status(401).json({error: "No token"});
    try {
        const decoded = jwt.verify(token, SECRET);
        const user = await User.findById(decoded.id);
        res.json(user);
    } catch(e) { res.status(401).json({error: "Token inválido"}); }
};

exports.updateUser = async (req, res) => {
    const { username, historyItem, favoriteId } = req.body;
    const user = await User.findOne({ username });
    if(historyItem) user.history.push(historyItem);
    if(favoriteId) {
        if(!user.favorites.includes(favoriteId)) user.favorites.push(favoriteId);
        else user.favorites = user.favorites.filter(id => id !== favoriteId); 
    }
    await user.save();
    res.json({ success: true });
}