import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";

// Get environment variables with fallbacks for build time
const R2_ENDPOINT = process.env.CLOUDFLARE_R2_S3_ENDPOINT || "";
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || "";

// Validate required environment variables at runtime
function validateConfig() {
  if (!R2_ENDPOINT) throw new Error("Missing CLOUDFLARE_R2_S3_ENDPOINT");
  if (!ACCESS_KEY_ID) throw new Error("Missing CLOUDFLARE_R2_ACCESS_KEY_ID");
  if (!SECRET_ACCESS_KEY)
    throw new Error("Missing CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  if (!BUCKET_NAME) throw new Error("Missing CLOUDFLARE_R2_BUCKET");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export type R2Item = {
  key: string;
  size: number;
  lastModified: Date;
};

export async function listR2Objects(prefix?: string): Promise<R2Item[]> {
  try {
    validateConfig();

    const command = new ListObjectsCommand({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) return [];

    return response.Contents.map((item) => ({
      key: item.Key!,
      size: item.Size!,
      lastModified: item.LastModified!,
    }));
  } catch (error) {
    console.error("Error listing R2 objects:", error);
    return [];
  }
}
