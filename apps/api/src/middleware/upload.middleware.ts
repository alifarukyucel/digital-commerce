import multer from 'multer';
import { ApiError } from './error.middleware';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '524288000'); // 500MB
const ALLOWED_TYPES = process.env.ALLOWED_FILE_TYPES?.split(',') || [
  '.pdf',
  '.epub',
  '.zip',
  '.mp4',
  '.mov',
  '.avi',
  '.jpg',
  '.png',
  '.webp',
];

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

  if (!ALLOWED_TYPES.includes(ext)) {
    cb(new ApiError(400, 'INVALID_FILE_TYPE', `File type ${ext} not allowed`));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});
