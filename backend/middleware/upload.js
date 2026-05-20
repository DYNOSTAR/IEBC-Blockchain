const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const idCardStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/id-cards');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${req.user.id}_${Date.now()}${ext}`);
    }
});

const faceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/face-images');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${req.user.id}_${Date.now()}${ext}`);
    }
});

const imageFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

exports.uploadIdCard = multer({ storage: idCardStorage, fileFilter: imageFilter, limits }).single('idCardImage');
exports.uploadFace   = multer({ storage: faceStorage,   fileFilter: imageFilter, limits }).single('faceImage');
