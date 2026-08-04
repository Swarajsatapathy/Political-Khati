import "./env.js";

import { S3Client } from "@aws-sdk/client-s3";

const requiredEnvironmentVariables = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_BUCKET_NAME",
];

const missingEnvironmentVariables =
  requiredEnvironmentVariables.filter(
    (variableName) => !process.env[variableName]
  );

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing AWS environment variables: ${missingEnvironmentVariables.join(
      ", "
    )}`
  );
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default s3;