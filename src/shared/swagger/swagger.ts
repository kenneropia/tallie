import { allPaths } from "./paths";
import { schemas } from "./schemas/index";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Tallie Restaurant Reservation API",
    version: "1.0.0",
    description:
      "API for managing restaurant reservations, waitlists, and table availability",
  },
  servers: [
    {
      url: "https://tallie.onrender.com/api",
      description: "Production server",
    },
    {
      url: "http://localhost:3000/api",
      description: "Development server",
    },
  ],
  paths: allPaths,
  components: {
    schemas,
  },
};

export default swaggerDocument;
