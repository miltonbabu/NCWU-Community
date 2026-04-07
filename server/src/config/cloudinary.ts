import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("Cloudinary config:", { cloudName, apiKey: apiKey ? "set" : "missing", apiSecret: apiSecret ? "set" : "missing" });

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Cloudinary credentials not configured - uploads will fail!");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  format?: string;
  quality?: number;
}

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export const uploadToCloudinary = async (
  file: UploadedFile,
  folder: string = "ncwu",
  transformation?: TransformationOptions
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: folder,
        transformation: transformation || {},
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result as UploadApiResponse);
      }
    );
    
    uploadStream.end(file.buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
        return reject(error);
      }
      resolve();
    });
  });
};

export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    if (!url.includes("cloudinary.com")) {
      return null;
    }
    
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (matches && matches[1]) {
      return matches[1];
    }
    return null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

export { cloudinary };
