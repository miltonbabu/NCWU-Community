declare module 'express' {
  export { Request, Response, NextFunction, Router } from 'express-serve-static-core';
}

declare module 'multer' {
  interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }
}
