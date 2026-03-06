import express from 'express'

const router = express.Router()

// In-memory store (fine for hackathon)
const complaints = []

router.post('/', (req, res) => {
  const { category, description, language } = req.body

  if (!category || !description) {
    return res.status(400).json({ error: 'Category and description are required' })
  }

  const ticket = {
    id: 'UBI-' + Math.floor(Math.random() * 90000 + 10000),
    category,
    description,
    language,
    status: 'Open',
    createdAt: new Date().toISOString()
  }

  complaints.push(ticket)
  console.log('📝 New complaint:', ticket.id, '-', category)

  res.json({
    ticketId: ticket.id,
    status: ticket.status,
    message: `Your complaint has been registered. Ticket ID: ${ticket.id}. Our team will contact you within 24 hours.`,
    createdAt: ticket.createdAt
  })
})

router.get('/', (req, res) => {
  res.json({ complaints, total: complaints.length })
})

export default router