import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/')); 
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`); 
    },
});

export const upload = multer({ storage: storage });
export const uploadFile = upload.single('file');
