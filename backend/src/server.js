require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database"); //ESTO HACE ALGO????
const roomRoutes = require("./routes/roomRoutes");
const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");


connectDB();


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", roomRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes); // NUEVO: Registrar ruta

// --- Swagger ---
const setupSwagger = require('./swagger');
setupSwagger(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto " + PORT));
