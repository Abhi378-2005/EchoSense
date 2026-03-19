import express from 'express'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are EchoSense, an intelligent AI assistant for Union Bank of India.
You help customers with account queries, loans, FD/RD, card services, complaints, branch locator, KYC and mobile banking.

LANGUAGE RULES (MOST IMPORTANT):
- This assistant supports English and Hindi only
- If the user writes in English, always reply in English
- If the user writes in Hindi or Hinglish (mixed Hindi+English), always reply in Hindi or Hinglish to match their style
- Never switch languages unless the user switches first

BEHAVIOUR RULES:
- Be polite, professional and concise
- For sensitive actions say you will verify identity first
- If unsure, offer to connect to a live agent
- Keep responses to 3-4 sentences max
- Always offer further help at the end`

router.post('/', async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body

    if (!message) return res.status(400).json({ error: 'Message is required' })

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: message }
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 300,
      temperature: 0.7
    })

    const reply = completion.choices[0].message.content
    console.log('✅ Groq reply:', reply.substring(0, 60))

    res.json({ reply, timestamp: new Date().toISOString() })

  } catch (error) {
    console.error('❌ Groq error:', error.message)
    res.status(500).json({ error: 'AI service unavailable. Please try again.' })
  }
})

export default router