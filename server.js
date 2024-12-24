import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS first
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'videos');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAP5TbF1mdiHfdYyPWvVHeKOCP0HWQiwcQ",
    authDomain: "alinked-3f9fe.firebaseapp.com",
    projectId: "alinked-3f9fe",
    storageBucket: "alinked-3f9fe.firebasestorage.app",
    messagingSenderId: "671854646256",
    appId: "1:671854646256:web:1a4a42264f9b0b9ee5c335",
    measurementId: "G-STSJX13JE1"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    }
});

// Serve static files from public directory
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// Handle file upload - move this before other routes
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded' 
            });
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('video/')) {
            return res.status(400).json({
                success: false,
                error: 'File must be a video'
            });
        }

        const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const fileExtension = req.file.originalname.split('.').pop();
        const storageRef = ref(storage, `videos/${fileId}.${fileExtension}`);

        // Upload to Firebase Storage
        const snapshot = await uploadBytes(storageRef, req.file.buffer);
        const downloadURL = await getDownloadURL(storageRef);

        // Store video metadata
        const metadata = {
            originalName: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            uploadDate: new Date().toISOString(),
            downloadURL: downloadURL,
            id: fileId
        };

        res.json({
            success: true,
            url: downloadURL,
            videoId: fileId,
            metadata: metadata
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Upload failed: ' + error.message 
        });
    }
});

// Serve video files
app.get('/videos/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'videos', req.params.id));
});

// Handle watch routes
app.get('/watch/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'watch.html'));
});

// Handle share routes
app.get('/share/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'share.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 