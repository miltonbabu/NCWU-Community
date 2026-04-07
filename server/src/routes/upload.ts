import express, { Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const result = await uploadToCloudinary(req.file, "ncwu/avatars", {
        width: 200,
        height: 200,
        crop: "fill",
        format: "webp",
        quality: 90,
      });

      res.json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        },
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload avatar",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

router.post(
  "/post-image",
  authenticate,
  upload.array("images", 5),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadResults = [];

      for (const file of files) {
        const result = await uploadToCloudinary(file, "ncwu/posts", {
          width: 1200,
          height: 800,
          crop: "limit",
          format: "webp",
          quality: 85,
        });
        uploadResults.push({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        });
      }

      res.json({
        success: true,
        message: "Images uploaded successfully",
        urls: uploadResults.map((r) => r.url),
        data: uploadResults,
      });
    } catch (error) {
      console.error("Post images upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload post images",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

router.delete(
  "/image/:publicId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await deleteFromCloudinary(req.params.publicId);
      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Image delete error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Discord chat image upload
router.post(
  "/discord-image",
  authenticate,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      const result = await uploadToCloudinary(req.file, "ncwu/discord", {
        width: 1200,
        height: 800,
        crop: "limit",
        format: "webp",
        quality: 85,
      });

      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        },
      });
    } catch (error) {
      console.error("Discord image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Language Exchange chat image upload
router.post(
  "/language-exchange-image",
  authenticate,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      const result = await uploadToCloudinary(
        req.file,
        "ncwu/language-exchange",
        {
          width: 1200,
          height: 800,
          crop: "limit",
          format: "webp",
          quality: 85,
        },
      );

      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        },
      });
    } catch (error) {
      console.error("Language exchange image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Generic image upload for events
router.post(
  "/image",
  authenticate,
  upload.single("image"),
  async (req: Request, res: Response) => {
    console.log("=== Event Image Upload Request ===");
    console.log("File received:", req.file ? "Yes" : "No");
    console.log(
      "File details:",
      req.file
        ? {
            fieldname: req.file.fieldname,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : "No file",
    );

    try {
      if (!req.file) {
        console.log("ERROR: No file in request");
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      console.log("Uploading to Cloudinary...");
      const result = await uploadToCloudinary(req.file, "ncwu/events", {
        width: 1200,
        height: 800,
        crop: "limit",
        format: "webp",
        quality: 85,
      });

      console.log("Cloudinary result:", result.secure_url);

      res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        },
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Market image upload
router.post(
  "/market-image",
  authenticate,
  upload.array("images", 4),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      console.log("Market image upload - files received:", files?.length || 0);

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadResults = [];

      for (const file of files) {
        console.log(
          "Uploading file to Cloudinary:",
          file.originalname,
          "size:",
          file.size,
        );
        try {
          const result = await uploadToCloudinary(file, "ncwu/market", {
            width: 1200,
            height: 800,
            crop: "limit",
            format: "webp",
            quality: 85,
          });
          console.log("Cloudinary upload success:", result.secure_url);
          uploadResults.push({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
          });
        } catch (uploadError) {
          console.error(
            "Cloudinary upload failed for file:",
            file.originalname,
            uploadError,
          );
          throw uploadError;
        }
      }

      console.log("All uploads completed:", uploadResults);
      res.json({
        success: true,
        message: "Images uploaded successfully",
        urls: uploadResults.map((r) => r.url),
        data: uploadResults,
      });
    } catch (error) {
      console.error("Market images upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload images",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

// Gallery image upload (high quality for photo gallery)
router.post(
  "/gallery-image",
  authenticate,
  upload.array("images", 6),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadResults = [];

      for (const file of files) {
        const result = await uploadToCloudinary(file, "ncwu/gallery", {
          width: 1920,
          height: 1280,
          crop: "limit",
          format: "webp",
          quality: 90,
        });
        uploadResults.push({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
        });
      }

      res.json({
        success: true,
        message: "Gallery images uploaded successfully",
        urls: uploadResults.map((r) => r.url),
        data: uploadResults,
      });
    } catch (error) {
      console.error("Gallery images upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload gallery images",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
