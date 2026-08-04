import jwt from "jsonwebtoken";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (
    authHeader &&
    authHeader.startsWith("Bearer ")
  ) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.admin = decoded;

    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
});

export { protectAdmin };