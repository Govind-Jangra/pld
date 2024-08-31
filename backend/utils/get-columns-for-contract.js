import OpenAI from 'openai';
import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getColumnsForContract = async (headerRow) => {
    const systemPrompt = {
        role: 'system',
        content: `You will be provided a header row in JSON format. Like:
{
  "Print Date": "01/02/2024",
  "Ship Date": "01/02/2024",
  "Amount Paid": 1.35,
  "Adj# Amount": 0,
  "Quoted Amount": 1.35,
  "Origin Zip": 7644,
  "Dest State": "PR",
  "Dest Zip": "00739",
  "Carrier": "USPS",
  "Class Service": "USPS First-Class Mail®",
  "Insured Value": 0,
  "Weight": "0lb 4oz"
}
  Now you have to give me the JSON keys for two columns:
  first column: it is the class service or if it is not present you can take a similar column key,
  second column: it is the Weight column if you don't find it you can take a similar column key.
  third column: it is the Quoted Amount  column if you don't find it you can take a similar column key.
  Response format: You have to give me the JSON keys for three columns like: ["Class Service","Weight","Quoted Amount"]`,
    };

    const userPrompt = {
        role: 'user',
        content: headerRow,
    }
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          systemPrompt,
          userPrompt
        ]
    });
    
    const responseContent = response.choices[0].message.content.trim();
    const sanitizedContent = responseContent.replace(/'/g, '"');
    
   
    const columns = JSON.parse(sanitizedContent);
    console.log(columns);
    return columns;
};

export default getColumnsForContract;
