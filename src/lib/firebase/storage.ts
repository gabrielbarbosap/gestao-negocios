import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadResult,
} from "firebase/storage";
import { storage } from "./config";

export async function uploadFile(
  path: string,
  file: File
): Promise<{ url: string; result: UploadResult }> {
  const storageRef = ref(storage, path);
  const result = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(result.ref);
  return { url, result };
}

export async function getFileUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}

export async function removeFile(path: string): Promise<void> {
  return deleteObject(ref(storage, path));
}
