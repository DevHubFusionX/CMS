const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Generate AI content
router.post('/generate-content', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Write a comprehensive blog post about: ${prompt}. Include headings, paragraphs, lists, and examples.`,
        parameters: {
          max_length: 500,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data[0]?.generated_text || 'Failed to generate content';

    res.json({ content });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

module.exports = router;