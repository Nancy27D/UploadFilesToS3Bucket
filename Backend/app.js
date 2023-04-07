const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const AWS = require("aws-sdk");
let multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const awsConfig = {
    accessKeyId: process.env.ACCESS_ID,
    secretAccessKey:  process.env.ACCESS_SECRET_KEY,
    region: process.env.REGION
};
const S3 = new AWS.S3(awsConfig);
const PORT = 3000;
const app = express();
//middleware
let cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Specify the multer config
let upload = multer({
    storage: multer.memoryStorage(),
    // limits: {
    //     fileSize: 1024 * 1024 * 5,
    // },
});
//upload to s3
const uploadToS3 = async (fileData, bId) => {
    const sharpData = await sharp(fileData.buffer).resize(400, 350).toFormat("webp").webp({ quality: 60 }).toBuffer()
    console.log("sharpData", sharpData, " 35") 
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: `nancytestbucket/${bId}`,
            Key: `${Date.now().toString() + fileData.originalname.replace(".jpg", ".webp").replace(".jpeg", ".webp").replace(".png", ".webp")}`,
            Body: sharpData,
        };
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err, "errerr");
                return reject(err);
            }
            return resolve(data);
        });
    });
};


const uploadToS3PDF = async (fileData, bId) => {
    // console.log(fileData, " uploadToS3 Filedata 44")
    console.log("fileData.buffer ", fileData.buffer, " 36")
    return new Promise((resolve, reject) => {
        //    console.log("sharpData",sharpData," 388888")
        const params = {
            Bucket: `nancytestbucket/${bId}`,
            Key: `${Date.now().toString() + fileData.originalname}`,
            Body: fileData.buffer,
        };
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err, "errerr");
                return reject(err);
            }
            return resolve(data);
        });
    });
};
//upload multiple images to s3
app.post("/upload-multiple", upload.array("files", 3), async (req, res) => {
    let data = []
    if (req.files && req.files.length > 0) {
        for (var i = 0; i < req.files.length; i++) {
            let data1;
            console.log(req.files[i], "(req.files[i]")
            if (req.files.mimetype === "image/jpeg" || req.files.mimetype === "image/png") {
                data1 = await uploadToS3(req.files[i], req.query.instituteID);
            } else {
                data1 = await uploadToS3PDF(req.files[i], req.query.instituteID);
            }
            data.push(data1)
            console.log(data1, "data1 129")
        }
    }
    res.send({
        msg: "Successfully uploaded " + req.files.length + " files!",
        data
    });
});

app.listen(PORT, () => console.log("server is running on " + PORT));