import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import errorMiddleware from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import articleRoutes from "./routes/articleRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/

const normalizeOrigin = (origin) => {
  return origin
    ?.trim()
    .replace(/\/+$/, "");
};

const additionalOrigins =
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : [];

const allowedOrigins = new Set(
  [
    "http://localhost:3000",
    "http://localhost:3001",

    // Exact deployed admin URL
    "https://political-khati-adminpage.vercel.app",

    process.env.CLIENT_URL,
    process.env.ADMIN_URL,

    ...additionalOrigins,
  ]
    .filter(Boolean)
    .map(normalizeOrigin)
);

/*
 * Check this output inside Render logs.
 */
console.log(
  "✅ Allowed CORS origins:",
  Array.from(allowedOrigins)
);

const corsOptions = {
  origin(origin, callback) {
    /*
     * Allow Postman, curl, Render health checks
     * and server-to-server requests.
     */
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin =
      normalizeOrigin(origin);

    if (
      allowedOrigins.has(
        normalizedOrigin
      )
    ) {
      console.log(
        `✅ CORS allowed: ${origin}`
      );

      return callback(null, true);
    }

    console.error(
      `❌ CORS blocked: ${origin}`
    );

    console.error(
      "Allowed origins:",
      Array.from(allowedOrigins)
    );

    return callback(
      new Error(
        `Origin ${origin} is not allowed by CORS`
      )
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

/*
 * Explicitly handle every OPTIONS preflight request.
 * Regex is used because this project uses Express 5.
 */
app.options(
  /.*/,
  cors(corsOptions)
);

app.use(cors(corsOptions));

app.use(helmet());

app.use(compression());

app.use(
  morgan(
    process.env.NODE_ENV ===
      "production"
      ? "combined"
      : "dev"
  )
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Political Khati Backend API 🚀",
  });
});

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message:
        "Political Khati backend is healthy",
      timestamp:
        new Date().toISOString(),
      allowedOrigins:
        Array.from(allowedOrigins),
    });
  }
);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/articles",
  articleRoutes
);

app.use(
  "/api/videos",
  videoRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

export default app;