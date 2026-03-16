import { put, del } from '@vercel/blob';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN as string;

export interface UploadResult {
  url: string;
  pathname: string;
}

// Upload a file — returns both the full public URL and pathname
export async function uploadFile(
  pathname: string,
  body: Buffer | Blob | ReadableStream,
  contentType: string
): Promise<UploadResult> {
  const result = await put(pathname, body, {
    access: 'public',
    token: TOKEN,
    contentType,
  });
  return { url: result.url, pathname: result.pathname };
}

// Delete a file by pathname
export async function deleteFile(pathname: string) {
  return del(pathname, { token: TOKEN });
}
