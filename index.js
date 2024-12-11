const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: 'https://codingkatty.github.io',
}));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const fileName = `${Date.now()}-${req.file.originalname}`;
        const fileBuffer = req.file.buffer;
        const fileType = req.file.mimetype;

        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, fileBuffer, {
                contentType: fileType,
                upsert: false,
            });

        if (error) {
            throw error;
        }

        const { publicURL, error: publicUrlError } = supabase
            .storage
            .from('images')
            .getPublicUrl(data.path);

        if (publicUrlError) {
            throw publicUrlError;
        }

        console.log('Image uploaded:', publicURL);

        res.status(200).json({ url: publicURL });
    } catch (error) {
        console.error('Error uploading image:', error.message);
        res.status(500).json({ error: 'Failed to upload image.' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).send('Image upload server is running.');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});