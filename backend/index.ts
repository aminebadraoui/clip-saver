import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static files from temp directory
app.use('/temp', express.static(path.join(__dirname, 'temp')));

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

app.post('/api/download', async (req, res) => {
    const { videoId } = req.body;

    if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const outputTemplate = path.join(tempDir, '%(title)s-%(id)s.%(ext)s');

    // Check if file already exists
    const existingFiles = fs.readdirSync(tempDir).filter(f => f.includes(videoId));
    if (existingFiles.length > 0) {
        return res.json({ url: `/temp/${existingFiles[0]}`, filename: existingFiles[0] });
    }

    console.log(`Downloading video: ${videoId}`);

    let responseSent = false;

    // Spawn yt-dlp process
    const ytdlp = spawn('yt-dlp', [
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '-o', outputTemplate,
        '--no-playlist',
        '--quiet',
        '--progress',
        videoUrl
    ]);

    let downloadedFile = '';

    ytdlp.stdout.on('data', (data) => {
        console.log(`yt-dlp: ${data}`);
    });

    ytdlp.stderr.on('data', (data) => {
        console.error(`yt-dlp error: ${data}`);
    });

    ytdlp.on('close', (code) => {
        if (responseSent) return;

        if (code === 0) {
            // Find the downloaded file
            const files = fs.readdirSync(tempDir).filter(f => f.includes(videoId));
            if (files.length > 0) {
                downloadedFile = files[0];
                console.log(`Download complete: ${downloadedFile}`);
                responseSent = true;
                res.json({ url: `/temp/${downloadedFile}`, filename: downloadedFile });
            } else {
                responseSent = true;
                res.status(500).json({ error: 'Download completed but file not found' });
            }
        } else {
            responseSent = true;
            res.status(500).json({ error: `yt-dlp exited with code ${code}` });
        }
    });

    ytdlp.on('error', (error) => {
        if (responseSent) return;

        console.error('Failed to start yt-dlp:', error);
        responseSent = true;
        res.status(500).json({
            error: 'Failed to start yt-dlp. Make sure it is installed (pip install yt-dlp or brew install yt-dlp)',
            details: error.message
        });
    });
});

app.get('/api/info', async (req, res) => {
    const { videoId } = req.query;

    if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`Fetching info for: ${videoId}`);

    const ytdlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        '--quiet',
        videoUrl
    ]);

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
        output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
        if (code === 0) {
            try {
                const info = JSON.parse(output);
                res.json({
                    title: info.title,
                    thumbnail: info.thumbnail,
                    duration: info.duration,
                    uploadDate: info.upload_date,
                    uploader: info.uploader,
                    viewCount: info.view_count
                });
            } catch (e) {
                console.error('Failed to parse yt-dlp output', e);
                res.status(500).json({ error: 'Failed to parse video info' });
            }
        } else {
            console.error(`yt-dlp info failed: ${errorOutput}`);
            res.status(500).json({ error: 'Failed to fetch video info' });
        }
    });
});

app.delete('/api/cleanup', (req, res) => {
    const { filename } = req.body;
    if (!filename) {
        return res.status(400).json({ error: 'Missing filename' });
    }

    const filePath = path.join(tempDir, filename);

    // Security check: ensure filename is just a filename and not a path traversal
    if (filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
    }

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
