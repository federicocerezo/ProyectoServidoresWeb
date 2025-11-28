// js/app.js
const app = {
    state: {
        username: '',
        roomCode: '',
        userId: null,
        participants: [],
        currentCard: 0,
        cards: [
            // Ejemplo de tarjetas de restaurantes; normalmente esto vendría del servidor
            { id: 1, name: "La Trattoria", type: "Italiana", price: "€€", distance: 1.2, rating: 4.5, image: "https://picsum.photos/300/400?random=1", mapUrl: "https://www.google.com/maps" },
            { id: 2, name: "Sushi House", type: "Japonesa", price: "€€€", distance: 0.8, rating: 4.7, image: "https://picsum.photos/300/400?random=2", mapUrl: "https://www.google.com/maps" },
            { id: 3, name: "Burger King", type: "Fast Food", price: "€", distance: 2.5, rating: 4.0, image: "https://picsum.photos/300/400?random=3", mapUrl: "https://www.google.com/maps" },
        ]
    },

    controller: {
        createRoom: async function() {
            const input = document.getElementById('username-input');
            const username = input.value.trim();
            if (!username) return alert("Ingresa tu nombre");

            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const room = await res.json();
            app.state.username = username;
            app.state.userId = room.users[0].id;
            app.state.roomCode = room.code;
            app.state.participants = room.users;
            app.router.navigate('lobby');
        },

        joinRoom: async function() {
            const username = document.getElementById('username-input').value.trim();
            const code = document.getElementById('room-code-input').value.trim().toUpperCase();

            if (!username || !code) return alert("Ingresa tu nombre y código de sala");

            const res = await fetch(`/api/rooms/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            if (!res.ok) return alert("Sala no encontrada");

            const user = await res.json();
            app.state.username = username;
            app.state.userId = user.id;
            app.state.roomCode = code;
            // Para simplificar, agregamos solo a este usuario; en una app real habría un websocket para actualizar todos
            app.state.participants.push(user);
            app.router.navigate('lobby');
        },

        toggleFlip: function() {
            const card = document.getElementById('card-inner');
            card.classList.toggle('flipped');
        },

        handleVote: async function(liked) {
            const card = app.state.cards[app.state.currentCard];

            await fetch(`/api/rooms/${app.state.roomCode}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: app.state.userId,
                    restaurantId: card.id,
                    liked
                })
            });

            // Pasar a la siguiente tarjeta
            app.state.currentCard++;
            if (app.state.currentCard >= app.state.cards.length) {
                alert("¡Has terminado todas las votaciones!");
                app.router.navigate('home');
            } else {
                app.controller.renderCard();
            }
        },

        renderCard: function() {
            const card = app.state.cards[app.state.currentCard];
            if (!card) return;

            document.getElementById('card-image').src = card.image;
            document.getElementById('card-name').textContent = card.name;
            document.getElementById('card-type').textContent = card.type;
            document.getElementById('card-price').textContent = card.price;
            document.getElementById('card-distance').textContent = `${card.distance}km`;
            document.getElementById('card-rating').textContent = card.rating;
            document.getElementById('card-map-frame').src = card.mapUrl;

            // Asegurarse de que la tarjeta esté frontal
            document.getElementById('card-inner').classList.remove('flipped');
        }
    },

    router: {
        navigate: function(view) {
            document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`view-${view}`).classList.add('active');

            if (view === 'lobby') {
                document.getElementById('display-room-code').textContent = app.state.roomCode;
                document.getElementById('participants-count').textContent = app.state.participants.length;
                const list = document.getElementById('participants-list');
                list.innerHTML = '';
                app.state.participants.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = p.name;
                    list.appendChild(li);
                });
            }

            if (view === 'swipe') {
                app.controller.renderCard();
            }
        }
    }
};
