const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const s3Client = require('./aws_s3_client');

dotenv.config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileName = `${Date.now()}_${file.originalname}`;
            cb(null, fileName);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        cacheControl: 'public, max-age=31536000',
        acl: 'public-read',
    }),
});

module.exports = upload;

module.exports.deleteFileFromS3 = async function (fileUrl) {
    try {
        const bucketName = process.env.S3_BUCKET_NAME;
        const urlParts = fileUrl.split('/');
        const key = urlParts.slice(3).join('/');

        const params = {
            Bucket: bucketName,
            Key: key,
        };

        await s3.deleteObject(params).promise();
        console.log(`Deleted: ${key}`);
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        throw error;
    }
};
