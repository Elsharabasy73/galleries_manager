const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

let client;

const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const getClient = () => {
  if (!client) {
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
const getKey = (type, folderName, fileName) =>
  ["uploads", type, folderName, fileName].join("/");

const saveStorageFile = async ({
  type,
  folderName,
  fileName,
  buffer,
  contentType,
}) => {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: getKey(type, folderName, fileName),
      Body: buffer,
      ContentType: contentType,
    }),
  );
};

const deleteStorageFile = async (type, folderName, fileName) => {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: getKey(type, folderName, fileName),
    }),
  );
};

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

const deleteStorageKey = async (type, key) => {
  const segments = key.split("/");
  const fileName = segments.pop();

  if (!fileName || segments.length === 0) {
    throw new Error("Invalid storage key");
  }

  await deleteStorageFile(type, segments.join("/"), fileName);
};

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
