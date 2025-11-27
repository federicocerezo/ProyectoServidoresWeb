# Usamos una versión ligera de Node.js
FROM node:18-alpine

# Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de configuración de dependencias primero
COPY package*.json ./

# Instalamos las librerías
RUN npm install

# Copiamos el resto del código del backend
COPY . .

# Informamos que este contenedor usa el puerto 5000
EXPOSE 5000

# Comando para iniciar el servidor
CMD ["node", "server.js"]