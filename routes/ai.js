const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generate AI content
router.post('/generate-content', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [{
        role: 'system',
        content: 'You are a Markdown-to-HTML formatter for a CMS blog. Convert raw blog post text into clean HTML with semantic tags: <h1>, <h2>, <p>, <ul>, <li>, <blockquote>, and <pre><code>. Format paragraphs, structure sections properly, and ensure it\'s clean and readable for Tailwind\'s prose class.'
      }, {
        role: 'user',
        content: `Create a comprehensive blog post about: ${prompt}.

Format as semantic HTML:
- <h1> for main title
- <h2> for section headings  
- <p> for paragraphs
- <ul><li> with <strong> for emphasis (e.g., <strong>CPU:</strong> The brain...)
- <blockquote> for quotes
- <pre><code> for code examples
- Proper spacing between sections
- Professional article structure

Example format:
<h1>Title</h1>
<p>Introduction paragraph...</p>
<h2>Section Heading</h2>
<ul>
  <li><strong>Term:</strong> Description</li>
</ul>`
      }],
      model: 'compound-beta',
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1
    });

    const content = chatCompletion.choices[0].message.content;

    res.json({ content });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

module.exports = router;