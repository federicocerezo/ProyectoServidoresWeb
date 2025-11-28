const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GastroMatch API",
      version: "1.0.0",
      description: "API para gestionar salas, usuarios y votaciones",
    },
    servers: [
      { url: "http://localhost:5000/api" }
    ]
  },
  apis: ["./src/routes/*.js"], // aquí se buscan los comentarios JSDoc
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
