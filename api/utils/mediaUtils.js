const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

function uploadMedia(subDir = '', allowVideos = false) {
  const allowedTypes = allowVideos
    ? /jpeg|jpg|png|gif|ico|mp4|mov|avi|mkv|webm|flv|wmv|m4v/
    : /jpeg|jpg|png|gif|ico/;

  const uploadDir = path.join(__dirname, `../../media/${subDir}`);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // Multer setup
  const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const uploader = multer({
    storage,
    fileFilter: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      allowedTypes.test(ext)
        ? cb(null, true)
        : cb(new Error('Invalid file type!'));
    },
    limits: { fileSize: process.env.MAX_FILE_SIZE * 1024 * 1024 },
  });

  // ---- Automatic compress function ----
  const compressFile = async (file) => {
    const filePath = file.path;
    const ext = path.extname(filePath).toLowerCase();

    // Lossless image compression
    if (/jpeg|jpg|png|gif|ico/.test(ext)) {
      const tempPath = filePath + '_lossless' + ext;
      await sharp(filePath)
        .toFormat('jpeg', { quality: 100, chromaSubsampling: '4:4:4' })
        .withMetadata()
        .toFile(tempPath);
      fs.renameSync(tempPath, filePath);
    }

    // Convert videos → .mp4 (lossless)
    else if (/mp4|mov|avi|mkv|m4v|webm|flv|wmv/.test(ext) && allowVideos) {
      const mp4Path = filePath.replace(ext, '.mp4');
      await new Promise((resolve, reject) => {
        ffmpeg(filePath)
          .output(mp4Path)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-crf 0', // truly lossless (use 18 for smaller)
            '-preset slow',
            '-pix_fmt yuv420p',
          ])
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
      fs.unlinkSync(filePath);
      file.filename = path.basename(mp4Path);
      file.path = mp4Path;
    }
  };

  // ---- Main middleware factory ----
  const middleware = (type, maxCount = 10) => {
    const uploadHandler =
      type === 'array'
        ? uploader.array('files', maxCount)
        : type === 'fields'
        ? uploader.fields(maxCount)
        : uploader.single('file');

    return async (req, res, next) => {
      req.setTimeout(10 * 60 * 1000)
      uploadHandler(req, res, async (err) => {
        if (err) return next(err);
        try {
          let files = [];
if (req.file) files = [req.file];
else if (Array.isArray(req.files)) files = req.files;
else if (req.files && typeof req.files === 'object') files = Object.values(req.files).flat();

for(const file of files) await compressFile(file)
          next();
        } catch (err) {
          console.error('Compression failed:', err);
          next();
        }
      });
    };
  };

  // Provide express-style helpers
  return {
    single: () => middleware('single'),
    array: (max = 10) => middleware('array', max),
    fields: (max = 10) => middleware('fields', max),
  };
}

module.exports = { uploadMedia };
