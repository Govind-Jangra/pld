import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const app = express();
const PORT = 5000;

const upload = multer({ dest: 'uploads/' });

app.use(express.static('uploads'));
app.use(cors("*"));

app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    // Load the uploaded Excel file
    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets["Sheet1"];

    // Convert the sheet to JSON
    const data = xlsx.utils.sheet_to_json(sheet);

    // Create a new array to store the processed data
    const processedData = data.map(row => ({
        'Class Service': row['Class Service'],
        'Weight': row['Weight'],
        'Discounted Amount': "20%", // Add any additional processing here
    }));

    // Sort the processed data by 'Class Service', then 'Weight', then 'Discounted Amount'
    processedData.sort((a, b) => {
        if (a['Class Service'] < b['Class Service']) return -1;
        if (a['Class Service'] > b['Class Service']) return 1;
        if (a['Weight'] < b['Weight']) return -1;
        if (a['Weight'] > b['Weight']) return 1;
        if (a['Discounted Amount'] < b['Discounted Amount']) return -1;
        if (a['Discounted Amount'] > b['Discounted Amount']) return 1;
        return 0;
    });

    // Create a new sheet from the sorted data
    const newSheet = xlsx.utils.json_to_sheet(processedData);

    // Append the new sheet to the existing workbook
    xlsx.utils.book_append_sheet(workbook, newSheet, 'Processed Data');

    // Save the updated workbook to a file
    const outputFilePath = path.join(path.resolve(), 'uploads', `processed_${file.originalname}`);
    xlsx.writeFile(workbook, outputFilePath);

    // Send the new file path to the frontend
    res.json({ filePath: `/processed_${file.originalname}` });

    // Clean up uploaded file
    fs.unlinkSync(file.path);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
