import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  console.log({
  envUsername: process.env.ADMIN_USERNAME,
  envPassword: process.env.ADMIN_PASSWORD,
  requestUsername: username,
  requestPassword: password,
});

  if (!username || !password) {
    throw new ApiError(400, "Username and password are required");
  }



  if (username !== process.env.ADMIN_USERNAME) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = generateToken({
    username,
    role: "admin",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
      },
      "Login successful",
    ),
  );
});

const verify = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        username: req.admin.username,
      },
      "Token is valid",
    ),
  );
});

export { login, verify };
