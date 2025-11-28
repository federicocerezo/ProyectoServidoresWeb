const View = {
    isFlipped: false,

    showSection: (id) => {
        document.querySelectorAll(".view-section").forEach(el => el.classList.remove("active"));
        document.getElementById(`view-${id}`).classList.add("active");
    },

    updateLobby: (code, users) => {
        document.getElementById("display-room-code").innerText = code;
        document.getElementById("participants-list").innerHTML =
            users.map(u => `<li>${u}</li>`).join("");
    },

    renderCard: (rest) => {
        if (!rest) return;

        View.isFlipped = false;
        document.getElementById("card-inner").classList.remove("flipped");

        document.getElementById("card-image").src = rest.image;
        document.getElementById("card-name").innerText = rest.name;
        document.getElementById("card-info").innerText = `${rest.type} • ${rest.price}`;
        document.getElementById("card-rating").innerText = rest.rating;

        const query = encodeURIComponent(rest.name + " restaurant");
        document.getElementById("card-map-frame").src =
            `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    },

    toggleFlip: () => {
        View.isFlipped = !View.isFlipped;
        document.getElementById("card-inner").classList.toggle("flipped", View.isFlipped);
    },

    renderMatches: (matches) => {
        const div = document.getElementById("matches-list");

        if (!matches.length)
            div.innerHTML = "<p>No hay coincidencias aún.</p>";
        else
            div.innerHTML = matches.map(m => 
                `<div style="padding:10px; border-bottom:1px solid #ccc"><strong>${m.name}</strong></div>`
            ).join("");
    }
};
