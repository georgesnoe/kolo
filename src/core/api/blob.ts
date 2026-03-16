import { put, del } from '@vercel/blob';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN as string;

// Upload a file — returns the pathname (store this in the database, not the full URL)
export async function uploadFile(
  pathname: string,
  body: Buffer | Blob | ReadableStream,
  contentType: string
): Promise<string> {
  const result = await put(pathname, body, {
    access: 'public',
    token: TOKEN,
    contentType,
  });
  return result.pathname;
}

// Delete a file
export async function deleteFile(pathname: string) {
  return del(pathname, { token: TOKEN });
}
