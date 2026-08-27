// This is the entry point of the server application.
// It sets up an Express server with CORS and JSON parsing middleware, and defines a health check endpoint.
// The server listens on a specified port, which can be configured through environment variables.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Create an instance of the Express application
const app = express();

// Define the port on which the server will listen, defaulting to 5000 if not specified in environment variables
const PORT = process.env.PORT || 5000;

// Enable CORS for requests from the client URL specified in environment variables, or default to localhost:3000
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));

// Enable JSON parsing for incoming requests
app.use(express.json());

// Define a health check endpoint that responds with a JSON object indicating the server's health status
app.get("/healthcheck", (_req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start the server and listen on the specified port, logging a message to indicate that the server is running
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
