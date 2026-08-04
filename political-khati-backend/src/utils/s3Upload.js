import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import s3 from "../config/s3.js";
const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const normalizeFolder = (folder) => {
  const cleanedFolder = String(folder || "articles")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "-");
  return cleanedFolder || "articles";
};
const getPublicUrl = (key) => {
  const customBaseUrl = process.env.AWS_PUBLIC_BASE_URL?.trim();
  if (customBaseUrl) {
    return `${customBaseUrl.replace(/\/+$/, "")}/${key}`;
  }
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
const uploadToS3 = async (buffer, mimetype, folder = "articles") => {
  if (!buffer) {
    throw new Error("Image buffer is required");
  }
  const extension = MIME_EXTENSION_MAP[mimetype];
  if (!extension) {
    throw new Error(
      "Unsupported image type. Only JPG, PNG, WebP and AVIF are allowed",
    );
  }
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is missing from environment variables");
  }
  const normalizedFolder = normalizeFolder(folder);
  const fileName = `${uuid()}.${extension}`;
  const key = `${normalizedFolder}/${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, url: getPublicUrl(key) };
};
const deleteFromS3 = async (key) => {
  if (!key || typeof key !== "string") {
    return;
  }
  const bucketName = process.env.AWS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is missing from environment variables");
  }
  const normalizedKey = key.trim().replace(/^\/+/, "");
  if (normalizedKey.includes("..") || normalizedKey.includes("\\")) {
    throw new Error("Invalid S3 object key");
  }
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: normalizedKey }),
  );
};
export { uploadToS3, deleteFromS3 };
