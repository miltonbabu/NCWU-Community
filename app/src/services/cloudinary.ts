const CLOUDINARY_CLOUD_NAME = "dq5yagotz";
const CLOUDINARY_UPLOAD_PRESET = "ncwu_unsigned";

interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  format?: string;
  quality?: number;
}

interface UploadOptions {
  transformation?: TransformationOptions;
  folder?: string;
}

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
}

async function uploadImageToCloudinary(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    
    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Cloudinary error:", data.error);
      throw new Error(data.error?.message || "Upload failed");
    }

    let finalUrl = data.secure_url;

    if (options?.transformation) {
      const t = options.transformation;
      const transforms: string[] = [];
      
      if (t.width) transforms.push(`w_${t.width}`);
      if (t.height) transforms.push(`h_${t.height}`);
      if (t.crop) transforms.push(`c_${t.crop}`);
      if (t.quality) transforms.push(`q_${t.quality}`);
      if (t.format) transforms.push(`f_${t.format}`);
      
      if (transforms.length > 0) {
        const transformString = transforms.join(",");
        finalUrl = finalUrl.replace(
          `/upload/`,
          `/upload/${transformString}/`
        );
      }
    }

    return {
      url: finalUrl,
      publicId: data.public_id,
      format: data.format,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_id: publicId }),
      }
    );

    if (!response.ok) {
      throw new Error("Delete failed");
    }
    await response.json();
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
}

export { uploadImageToCloudinary, deleteFromCloudinary };

export const cloudinaryService = {
  uploadImageToCloudinary,
  deleteFromCloudinary,
};
