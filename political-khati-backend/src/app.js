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
  return origin?.trim().replace(/\/+$/, "");
};

const environmentOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : []),
];

const allowedOrigins = new Set(
  [
    "http://localhost:3000",
    "http://localhost:3001",
    ...environmentOrigins,
  ]
    .filter(Boolean)
    .map(normalizeOrigin)
);

const corsOptions = {
  origin(origin, callback) {
    /*
     * Allow requests without an Origin header,
     * such as Postman, curl and Render health checks.
     */
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin =
      normalizeOrigin(origin);

    if (
      allowedOrigins.has(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    console.warn(
      `CORS blocked origin: ${origin}`
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
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
*/

app.use(cors(corsOptions));

app.use(helmet());

app.use(compression());

app.use(
  morgan(
    process.env.NODE_ENV === "production"
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

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Political Khati backend is healthy",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

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