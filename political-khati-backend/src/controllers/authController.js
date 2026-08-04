import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password) {
    throw new ApiError(400, "Username and password are required");
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error(
      "ADMIN_USERNAME or ADMIN_PASSWORD is missing from environment variables"
    );

    throw new ApiError(500, "Admin login is not configured");
  }

  const isUsernameCorrect = username.trim() === adminUsername;
  const isPasswordCorrect = password === adminPassword;

  if (!isUsernameCorrect || !isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateToken({
    username: adminUsername,
    role: "admin",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
        admin: {
          username: adminUsername,
          role: "admin",
        },
      },
      "Login successful"
    )
  );
});

const verify = asyncHandler(async (req, res) => {
  if (!req.admin) {
    throw new ApiError(401, "Unauthorized");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        username: req.admin.username,
        role: req.admin.role,
      },
      "Token is valid"
    )
  );
});

export { login, verify };