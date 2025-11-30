const API_URL = "http://localhost:5000/api/auth";

const Auth = {
    login: async () => {
        const user = document.getElementById("login-user").value;
        const pass = document.getElementById("login-pass").value;

        const res = await fetch(`${API_URL}/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", data.username);
            localStorage.setItem("userData", JSON.stringify(data)); 
            window.location.href = "home.html";
        } else {
            alert(data.error);
        }
    },

    register: async () => {
        const user = document.getElementById("reg-user").value;
        const pass = document.getElementById("reg-pass").value;
        
        if (!user || !pass) return alert("Rellena todos los campos");

        const res = await fetch(`${API_URL}/register`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await res.json();

        // AQUÍ ESTÁ EL CAMBIO CLAVE
        if (data.success) {
            // Guardamos sesión igual que en el login
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", data.username);
            localStorage.setItem("userData", JSON.stringify(data)); 
            
            // Redirigimos directamente
            window.location.href = "home.html";
        } else {
            alert(data.error || "Error al registrar");
        }
    },

    logout: () => {
        localStorage.clear();
        window.location.href = "index.html";
    }
};

function showForm(type) {
    const btnLogin = document.getElementById('tab-login');
    const btnReg = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');

    if(type === 'login') {
        formLogin.classList.remove('hidden');
        formReg.classList.add('hidden');
        btnLogin.classList.add('active');
        btnReg.classList.remove('active');
    } else {
        formLogin.classList.add('hidden');
        formReg.classList.remove('hidden');
        btnLogin.classList.remove('active');
        btnReg.classList.add('active');
    }
}