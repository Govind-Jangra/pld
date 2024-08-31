import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import getColumnsForContract from './utils/get-columns-for-contract.js';
import connectDB  from "./db/db.js"
import PriceRate from "./model/PriceRate.js"
// import convertLbAndOzToLb from "./utils/convert-lb-and-oz-to-lb.js"

const app = express();
connectDB();
const PORT = 5000;

const upload = multer({ dest: 'uploads/' });

app.use(cors("*"));

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const workbook = xlsx.readFile(file.path);
    const sheet = workbook.Sheets["Zonified Merge"];
    const data = xlsx.utils.sheet_to_json(sheet);

    try {
        const uniqueData = Array.from(
            new Map(
                data.map(row => [
                    `${row["Class Service"]}-${row["weight_oz"]}-${row["zone"]}-${row["Amount Paid"]}`,
                    row
                ])
            ).values()
        );


        const processedData = await Promise.all(uniqueData.map(async (row) => {
            let weight_lb = row["weight_oz"] ? row["weight_oz"] / 16 : row["Weight"];
            weight_lb = parseInt(weight_lb);
        
            if (weight_lb === 0) {
                weight_lb = 1;
            }
        
            let zone = row["Zone"];
            if (zone === 1) {
                zone = 2;
            }
        
            // Find the price rate based on the service, weight, and zone
            let priceRate = null;
            let price = null;
        
            if (weight_lb <= 150) {
                priceRate = await PriceRate.findOne({
                    "service.name": row["Class Service"],
                    "Weight.minWeight": { $lte: weight_lb },
                    "Weight.maxWeight": { $gte: weight_lb },
                    "zones": zone
                });
        
                // Check if priceRate was found
                if (priceRate && priceRate.rate?.StartingPrice) {
                    price = priceRate.rate.StartingPrice;
                } else {
                    console.warn(`PriceRate not found for ${row["Class Service"]}, Weight: ${weight_lb}, Zone: ${zone}`);
                }
            } else {
                // Greater than 150 lbs
                const zonesToPrice = {
                    "2": 0.72,
                    "3": 0.74,
                    "4": 0.80,
                    "5": 0.82,
                    "6": 0.90,
                    "7": 0.97,
                    "8": 1.10,
                    "44": 3.81,
                    "45": 5.10,
                    "46": 4.01
                };
        
                price = zonesToPrice[zone] ? zonesToPrice[zone] * weight_lb : null;
            }
        
            // Calculate the discount percentage only if the price is valid
            let discountPercentage = 0;
            if (price && price > 0) {
                const amountPaid = parseFloat(row["Amount Paid"]) * 2.7;
                if (amountPaid > 0 &&   Boolean(price)) {
                    discountPercentage = ((amountPaid - price) / amountPaid) * 100;
                    discountPercentage = isNaN(discountPercentage) ? 0 : discountPercentage.toFixed(2); 
                }
                else{
                    console.log("NAN")
                    discountPercentage=0;
                } 
            } else {
                console.warn(`Invalid price for ${row["Class Service"]}, Weight: ${weight_lb}, Zone: ${zone}`);
            }
            
            return {
                "Class Service": row["Class Service"],
                "Zone": zone,
                "Weight (lb)": weight_lb,
                "Original Amount Paid": parseFloat(row["Amount Paid"]),
                "Discount Percentage": discountPercentage
            };
        }));
        
        const aggregatedData = Object.values(processedData.reduce((acc, curr) => {
            const key = `${curr["Class Service"]}-${curr["Zone"]}-${curr["Weight (lb)"]}`;
            if (!acc[key]) {
                acc[key] = { 
                    ...curr, 
                    count: 1, 
                    "Original Amount Paid": parseFloat(curr["Original Amount Paid"]), 
                    "Discount Percentage": isNaN(parseFloat(curr["Discount Percentage"])) 
                                           ? 0 
                                           : parseFloat(curr["Discount Percentage"])
                };
            } else {
                acc[key]["Original Amount Paid"] += parseFloat(curr["Original Amount Paid"]);
                acc[key]["Discount Percentage"] += isNaN(parseFloat(curr["Discount Percentage"])) 
                                                   ? 0 
                                                   : parseFloat(curr["Discount Percentage"]);
                acc[key]["count"] += 1;
            }
            return acc;
        }, {})).map(row => ({
            "Class Service": row["Class Service"],
            "Zone": row["Zone"],
            "Weight (lb)": row["Weight (lb)"],
            "Original Amount Paid": (row["Original Amount Paid"] / row.count).toFixed(2),
            "Discount Percentage":  (row["Discount Percentage"] / row.count).toFixed(2) + '%'
        }));
        
        

        const newSheet = xlsx.utils.json_to_sheet(aggregatedData);
        xlsx.utils.book_append_sheet(workbook, newSheet, 'Processed Data');

        const outputFilePath = path.join(path.resolve(), 'uploads', `processed_${file.originalname}`);
        xlsx.writeFile(workbook, outputFilePath);

        res.json({ filePath: `/download/${path.basename(outputFilePath)}`,aggregatedData  });

        fs.unlinkSync(file.path);
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(500).send('Error processing the file.');
    }
});


app.get("/healthcheck",(req,res)=>{
    res.send("PLD is working")
})
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(path.resolve(), 'uploads', req.params.filename);

    res.download(filePath, err => {
        if (err) {
            console.error('File download error:', err);
            return res.status(500).send('File download failed.');
        }

        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
