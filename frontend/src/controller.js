const API_URL = "http://localhost:5000/api";

const Controller = {
    init: () => {
        View.showSection("home");
    },
    login: () => {
        const user = document.getElementById("username-input").value;
        if (!user) return alert("Nombre obligatorio");
        Model.user = user;
        document.getElementById("dashboard-username").innerText = user;
        View.renderHistory(); // Cargar historial
        View.showSection("dashboard");
    },

    logout: () => {
        Model.user = "";
        View.showSection("home");
    },

    createRoom: async () => {
        const type = document.getElementById("filter-type").value;
        const price = document.getElementById("filter-price").value;

        const res = await fetch(`${API_URL}/create-room`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" ,
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                username: Model.user,
                filters: { type, price } // Enviamos filtros
            })
        });

        const data = await res.json();
        Model.roomCode = data.roomCode;
        Model.participants = data.room.users;
        
        // Guardamos filtros en el modelo local
        Model.activeFilters = data.room.filters || { type: 'Any', price: 'Any' };

        app.router.navigate("lobby");
        Controller.startPolling();
    },

    joinRoom: async () => {
         // Copia tu joinRoom actual, pero maneja el error de "Ya empezó"
        const user = document.getElementById("username-input").value || Model.user; // Soporta login previo
        const code = document.getElementById("room-code-input").value;
        if (!user || !code) return alert("Datos incompletos");
        
        
        const res = await fetch(`${API_URL}/join-room`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ username: user, code })
        });
        const data = await res.json();

        if (!data.success) return alert(data.error); // Aquí saltará "La votación ya ha comenzado"

        Model.activeFilters = data.room.filters || { type: 'Any', price: 'Any' };
        Model.user = user;
        Model.roomCode = code;
        Model.participants = data.room.users;
        app.router.navigate("lobby");
        Controller.startPolling();
    },

    startVoting: async () => {
        // Primero, avisamos al backend
        await fetch(`${API_URL}/start-game`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ code: Model.roomCode })
        });

        // FILTRADO LOCAL
        let filtered = Model.restaurants;
        
        // Filtrar por Tipo
        if (Model.activeFilters.type !== 'Any') {
            filtered = filtered.filter(r => r.type === Model.activeFilters.type);
        }
        // Filtrar por Precio
        if (Model.activeFilters.price !== 'Any') {
            filtered = filtered.filter(r => r.price === Model.activeFilters.price);
        }

        if (filtered.length === 0) {
            alert("No hay restaurantes con esos filtros 😢. Mostrando todos.");
            // Si no hay, dejamos todos para no romper el juego
        } else {
            // Reemplazamos temporalmente la lista del modelo
            // Nota: Para hacerlo bien, deberíamos tener una lista 'original' y una 'display', 
            // pero para este ejemplo, sobrescribir funciona si recargamos la página al acabar.
            Model.restaurants = filtered;
        }

        app.router.navigate("swipe");
    },
    saveMatchToHistory: (match) => {
        const history = JSON.parse(localStorage.getItem('gastroHistory') || '[]');
        const newEntry = {
            name: match.name,
            type: match.type,
            price: match.price,
            date: new Date().toLocaleDateString()
        };
        history.unshift(newEntry); // Añadir al principio
        localStorage.setItem('gastroHistory', JSON.stringify(history));
    },

    handleVote: async (liked) => {
        const rest = Model.restaurants[Model.currentIndex];

        if (liked) {
            await fetch(`${API_URL}/vote`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                 },
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
                    if (currentSection === "view-match" && !Model.historySaved) {
                        Model.matches.forEach(m => Controller.saveMatchToHistory(m));
                        Model.historySaved = true; // Flag temporal
                    }
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
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ code: Model.roomCode })
            });
            // El polling detectará el 404 y nos mandará al home
        }
    }
};
