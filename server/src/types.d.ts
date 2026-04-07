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
  function multer(opts?: any): any;
  namespace multer {
    function memoryStorage(): any;
  }
  export = multer;
}
