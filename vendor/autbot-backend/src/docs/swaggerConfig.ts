import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AutBot API',
      version: '1.0.0',
      description: 'Documentação da API do AutBot',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['src/routes/*.ts', 'src/controllers/*.ts'], 
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
