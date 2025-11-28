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
        const user = document.getElementById("username-input").value;
        const code = document.getElementById("room-code-input").value;

        if (!user || !code) return alert("Datos incompletos");

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
    },

    startVoting: () => {
        app.router.navigate("swipe");
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

    startPolling: () => {
        setInterval(async () => {
            if (!Model.roomCode) return;

            const res = await fetch(`${API_URL}/room/${Model.roomCode}`);
            const data = await res.json();

            if (data) {
                Model.participants = data.users;

                if (document.getElementById("view-lobby").classList.contains("active")) {
                    View.updateLobby(Model.roomCode, Model.participants);
                }
            }
        }, 3000);
    }
};
