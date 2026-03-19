// backend/routes/chat.js  — ES Module version

import express from 'express'
import Groq from 'groq-sdk'
import { getSummary } from './analytics.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })  // ← moved inside
  const { message, language, history = [] } = req.body

  // Grab live stats summary (empty string if not loaded yet — graceful fallback)
  const liveSummary = getSummary()

  const systemPrompt = `You are EchoSense, an intelligent AI assistant for Union Bank of India.
You help customers with account queries, loans, FD/RD, card services, complaints, branch locator, KYC and mobile banking.

LANGUAGE RULES (MOST IMPORTANT):
- This assistant supports English and Hindi only
- If the user writes in English, always reply in English
- If the user writes in Hindi or Hinglish, always reply in Hindi or Hinglish to match their style
- Never switch languages unless the user switches first

BEHAVIOUR RULES:
- Be polite, professional and concise
- For sensitive actions say you will verify identity first
- If unsure, offer to connect to a live agent
- Keep responses to 3-4 sentences max
- Always offer further help at the end

${liveSummary ? `LIVE BANK STATISTICS (use these when customers ask about bank performance, loans, complaints, or transactions):
${liveSummary}` : ''}`

  try {
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 300,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that."
    res.json({ reply })
  } catch (err) {
    console.error('Groq error:', err.message)
    res.status(500).json({ error: 'AI service error. Please try again.' })
  }
})

export default router