const API_URL = "http://localhost:5000/api";

const Controller = {
    // 1. Convertimos init a ASYNC para poder esperar la descarga
    init: async () => {
        // Inicializar iconos si existen (opcional)
        if(window.lucide) lucide.createIcons();

        // 2. AÑADIMOS LA LÓGICA DE CARGA DE DATOS
        try {
            console.log("Cargando restaurantes desde MongoDB...");
            const res = await fetch(`${API_URL}/restaurants`);
            
            if (!res.ok) throw new Error("Error del servidor");

            const data = await res.json();
            
            // Guardamos los datos reales en el Modelo
            Model.restaurants = data;
            console.log(`¡Cargados ${data.length} restaurantes!`);
            
        } catch (error) {
            console.error("Error cargando datos:", error);
            alert("No se pudo conectar con el servidor Backend.");
        }

        // 3. Una vez cargado (o fallado), mostramos la Home
        View.showSection("home");
    },

    createRoom: async () => {
        const user = document.getElementById("username-input").value;
        if (!user) return alert("Nombre obligatorio");

        try {
            const res = await fetch(`${API_URL}/create-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user })
            });

            const data = await res.json();

            Model.user = user;
            Model.roomCode = data.roomCode;
            Model.participants = data.room.users;

            app.router.navigate("lobby");
            Controller.startPolling();
        } catch (e) { console.error(e); }
    },

    joinRoom: async () => {
        const user = document.getElementById("username-input").value;
        const code = document.getElementById("room-code-input").value;

        if (!user || !code) return alert("Datos incompletos");

        try {
            const res = await fetch(`${API_URL}/join-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user, code })
            });

            const data = await res.json();

            if (!data.success) return alert(data.error);

            Model.user = user;
            Model.roomCode = code;
            Model.participants = data.room.users;

            app.router.navigate("lobby");
            Controller.startPolling();
        } catch (e) { console.error(e); }
    },

    startVoting: () => {
        app.router.navigate("swipe");
    },

    handleVote: async (liked) => {
        const rest = Model.restaurants[Model.currentIndex];

        if (liked) {
            try {
                await fetch(`${API_URL}/vote`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code: Model.roomCode,
                        restaurantId: rest.id
                    })
                });
            } catch (e) { console.error(e); }
        }

        if (Model.currentIndex < Model.restaurants.length - 1) {
            Model.currentIndex++;
            // Pasamos el 2º argumento para actualizar el contador de "restantes"
            View.renderCard(Model.restaurants[Model.currentIndex], Model.restaurants.length - 1 - Model.currentIndex);
        } else {
            app.router.navigate("match");
        }
    },

    toggleFlip: () => View.toggleFlip(),

    startPolling: () => {
        setInterval(async () => {
            if (!Model.roomCode) return;

            try {
                const res = await fetch(`${API_URL}/room/${Model.roomCode}`);
                const data = await res.json();

                if (data) {
                    Model.participants = data.users;

                    if (document.getElementById("view-lobby").classList.contains("active")) {
                        View.updateLobby(Model.roomCode, Model.participants);
                    }
                    // Aquí podrías añadir lógica para detectar si hay match en el servidor
                }
            } catch (e) { console.error(e); }
        }, 3000);
    }
};