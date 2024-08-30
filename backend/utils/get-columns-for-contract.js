import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getColumnsForContract = async (contract) => {
  const response = await openai.completions.create({
    engine: 'text-davinci-003',
    prompt: `Given the following contract, please list the columns that need to be extracted from the contract:\n\n${contract}`,
    max_tokens: 50,
    n: 1,
    stop: ['\n'],
  });

  return response.choices[0].text.trim();
};
