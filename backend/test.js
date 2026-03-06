import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

try {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Say hello in one sentence' }],
    max_tokens: 50
  })
  console.log('✅ Groq works:', completion.choices[0].message.content)
} catch (e) {
  console.error('❌ Error:', e.message)
}