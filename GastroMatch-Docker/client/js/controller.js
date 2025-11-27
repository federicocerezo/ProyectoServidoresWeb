const API_URL = 'http://localhost:5000/api'; // URL del Backend en Docker

const Controller = {
    init: () => {
        if(window.lucide) lucide.createIcons();
        View.showSection('home');
    },
    
    // --- CONEXIÓN REAL CON BACKEND ---
    createRoom: async () => {
        const user = document.getElementById('username-input').value;
        if(!user) return alert("Nombre obligatorio");
        
        try {
            const res = await fetch(`${API_URL}/create-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user })
            });
            const data = await res.json();
            if(data.success) {
                Model.user = user;
                Model.roomCode = data.roomCode;
                Model.participants = data.room.users;
                app.router.navigate('lobby');
                Controller.startPolling(); // Empezar a escuchar cambios
            }
        } catch(e) { console.error(e); alert("Error conectando al servidor"); }
    },

    joinRoom: async () => {
        const user = document.getElementById('username-input').value;
        const code = document.getElementById('room-code-input').value;
        if(!user || !code) return alert("Datos incompletos");

        try {
            const res = await fetch(`${API_URL}/join-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, code: code })
            });
            const data = await res.json();
            if(data.success) {
                Model.user = user;
                Model.roomCode = code;
                Model.participants = data.room.users;
                app.router.navigate('lobby');
                Controller.startPolling();
            } else {
                alert(data.error);
            }
        } catch(e) { console.error(e); alert("Error conectando"); }
    },

    startVoting: () => {
        app.router.navigate('swipe');
    },

    handleVote: async (liked) => {
        const rest = Model.restaurants[Model.currentIndex];
        
        if(liked) {
            // Enviar voto al servidor
            await fetch(`${API_URL}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: Model.roomCode, 
                    restaurantId: rest.id 
                })
            });
        }

        if(Model.currentIndex < Model.restaurants.length - 1) {
            Model.currentIndex++;
            View.renderCard(Model.restaurants[Model.currentIndex], 5 - Model.currentIndex);
        } else {
            app.router.navigate('match');
        }
    },

    toggleFlip: () => View.toggleFlip(),

    // Polling para actualizar datos en tiempo real
    startPolling: () => {
        setInterval(async () => {
            if(!Model.roomCode) return;
            try {
                const res = await fetch(`${API_URL}/room/${Model.roomCode}`);
                const data = await res.json();
                if(data) {
                    Model.participants = data.users;
                    // Actualizar vista si estamos en lobby
                    if(document.getElementById('view-lobby').classList.contains('active')) {
                        View.updateLobby(Model.roomCode, Model.participants);
                    }
                    // Chequear matches (lógica simplificada)
                    // Aquí podrías implementar la lógica de match real del backend
                }
            } catch(e) { console.error("Error polling", e); }
        }, 3000);
    }
};