const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

let client;

// Read R2 configuration only when R2 is selected so local storage needs no R2 secrets.
const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const getClient = () => {
  if (!client) {
    // Cloudflare R2 exposes an S3-compatible API; these are its generated S3 credentials.
    client = new S3Client({
      region: "auto",
      endpoint: required("S3_BUCKET_ENDPOINT"),
      credentials: {
        accessKeyId: required("ACCESS_KEY_ID"),
        secretAccessKey: required("SECRET_ACCESS_KEY"),
      },
    });
  }

  return client;
};

const getBucket = () => required("R2_BUCKET_NAME");

// R2 has flat object keys, so folders are represented by slash-separated prefixes.
const getKey = (type, folderName, fileName) =>
  ["uploads", type, folderName, fileName].join("/");

// Store the optimized image buffer as an object and preserve its MIME type for delivery.
const saveStorageFile = async ({
  type,
  folderName,
  fileName,
  buffer,
  contentType,
}) => {
  //equal to client.send();
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: getKey(type, folderName, fileName),
      Body: buffer,
      ContentType: contentType,
    }),
  );
};

// Remove one object using the same key layout used during upload.
const deleteStorageFile = async (type, folderName, fileName) => {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: getKey(type, folderName, fileName),
    }),
  );
};

// R2 has no real directories; list every object with this prefix and delete in pages.
const deleteStorageFolder = async (type, folderName) => {
  const storageClient = getClient();
  const prefix = `uploads/${type}/${folderName}/`;
  let continuationToken;

  do {
    const page = await storageClient.send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    const objects = (page.Contents || []).map(({ Key }) => ({ Key }));

    if (objects.length) {
      const result = await storageClient.send(
        new DeleteObjectsCommand({
          Bucket: getBucket(),
          Delete: { Objects: objects, Quiet: true },
        }),
      );

      if (result.Errors?.length) {
        throw new Error(
          `R2 failed to delete ${result.Errors.length} object(s) from ${prefix}`,
        );
      }
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
};

// Product records keep folder/file references together; split that reference into R2 key parts.
const deleteStorageKey = async (type, key) => {
  const segments = key.split("/");
  const fileName = segments.pop();

  if (!fileName || segments.length === 0) {
    throw new Error("Invalid storage key");
  }

  await deleteStorageFile(type, segments.join("/"), fileName);
};

// Fetch every page so admin inventory and orphan checks see the full bucket prefix.
const listStorageFiles = async (type) => {
  const storageClient = getClient();
  const prefix = `uploads/${type}/`;
  const files = [];
  let continuationToken;

  do {
    const page = await storageClient.send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of page.Contents || []) {
      if (object.Key) {
        files.push(`${type}/${object.Key.slice(prefix.length)}`);
      }
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return files;
};

// Build a client-facing URL using the configured public bucket domain.
const getStorageFileUrl = (type, folderName, fileName) => {
  const publicUrl = required("R2_PUBLIC_URL").replace(/\/+$/, "");
  const parsedPublicUrl = new URL(publicUrl);

  if (!["http:", "https:"].includes(parsedPublicUrl.protocol)) {
    throw new Error("R2_PUBLIC_URL must use HTTP or HTTPS");
  }

  const key = getKey(type, folderName, fileName)
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${publicUrl}/${key}`;
};

module.exports = {
  saveStorageFile,
  deleteStorageFile,
  deleteStorageFolder,
  deleteStorageKey,
  listStorageFiles,
  getStorageFileUrl,
};
