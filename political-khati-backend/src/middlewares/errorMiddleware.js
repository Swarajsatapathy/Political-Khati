import multer from "multer";

const errorMiddleware = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error instanceof multer.MulterError) {
    statusCode = 400;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Each image must be smaller than 5 MB";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "A maximum of 5 images can be uploaded";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected image field or too many images";
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: error.stack,
    }),
  });
};

export default errorMiddleware;