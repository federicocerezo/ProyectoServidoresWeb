const API_URL = "http://localhost:5000/api";

const Controller = {
    init: () => {
        View.showSection("home");
    },

    createRoom: async () => {
        const user = document.getElementById("username-input").value;
        if (!user) return alert("Nombre obligatorio");

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
    },

    joinRoom: async () => {
         // Copia tu joinRoom actual, pero maneja el error de "Ya empezó"
        const user = document.getElementById("username-input").value;
        const code = document.getElementById("room-code-input").value;
        if (!user || !code) return alert("Datos incompletos");

        const res = await fetch(`${API_URL}/join-room`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, code })
        });
        const data = await res.json();

        if (!data.success) return alert(data.error); // Aquí saltará "La votación ya ha comenzado"

        Model.user = user;
        Model.roomCode = code;
        Model.participants = data.room.users;
        app.router.navigate("lobby");
        Controller.startPolling();
    },

    startVoting: async () => {
        await fetch(`${API_URL}/start-game`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: Model.roomCode })
        });
        // No hacemos navigate aquí, dejamos que el polling lo detecte
    },

    handleVote: async (liked) => {
        const rest = Model.restaurants[Model.currentIndex];

        if (liked) {
            await fetch(`${API_URL}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: Model.roomCode,
                    restaurantId: rest.id
                })
            });
        }

        if (Model.currentIndex < Model.restaurants.length - 1) {
            Model.currentIndex++;
            View.renderCard(Model.restaurants[Model.currentIndex]);
        } else {
            app.router.navigate("match");
        }
    },

    toggleFlip: () => View.toggleFlip(),

    // frontend/src/controller.js

    startPolling: () => {
        const intervalId = setInterval(async () => {
            if (!Model.roomCode) return;

            const res = await fetch(`${API_URL}/room/${Model.roomCode}`);
            
            // 3. DETECTAR SALA ELIMINADA (404)
            if (res.status === 404) {
                clearInterval(intervalId);
                alert("La sala ha sido cerrada.");
                Model.roomCode = ""; // Limpiar modelo
                app.router.navigate("home");
                return;
            }

            const data = await res.json();

            if (data) {
                Model.participants = data.users;

                // 2. SINCRONIZAR PANTALLA: Si el estado es 'voting' y sigo en el lobby -> moverme
                const currentSection = document.querySelector(".view-section.active").id;
                
                if (data.status === 'voting' && currentSection === 'view-lobby') {
                    app.router.navigate("swipe");
                }

                // ... (Lógica de matches anterior) ...
                if (data.matches && data.matches.length > 0) {
                    Model.matches = Model.restaurants.filter(r => data.matches.includes(r.id));
                }

                if (currentSection === "view-lobby") {
                    View.updateLobby(Model.roomCode, Model.participants);
                }
                if (currentSection === "view-match") {
                    View.renderMatches(Model.matches);
                }
                 if (Model.matches.length > 0 && currentSection === "view-swipe") {
                     const notif = document.getElementById("match-notification");
                     if(notif) notif.classList.remove("hidden");
                }
            }
        }, 3000);
    },
    finishGame: async () => {
        if (confirm("¿Finalizar y borrar sala?")) {
            await fetch(`${API_URL}/delete-room`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: Model.roomCode })
            });
            // El polling detectará el 404 y nos mandará al home
        }
    }
};
