import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { v4 as uuid } from "uuid";

import s3 from "../config/s3.js";

const uploadToS3 = async (
  buffer,
  mimetype,
  folder = "articles"
) => {
  const extension = mimetype.split("/")[1];

  const key = `${folder}/${uuid()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return {
    key,
    url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};

const deleteFromS3 = async (key) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    })
  );
};

export {
  uploadToS3,
  deleteFromS3,
};