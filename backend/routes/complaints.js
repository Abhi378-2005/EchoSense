import express from 'express'

const router = express.Router()

// In-memory store (fine for hackathon)
const complaints = []

router.post('/', (req, res) => {
  const { category, description, language } = req.body

  if (!category || !description) {
    return res.status(400).json({ error: 'Category and description are required' })
  }

  if (String(description).trim().length > 1200) {
    return res.status(400).json({ error: 'Description is too long.' })
  }

  const ticket = {
    id: 'UBI-' + Math.floor(Math.random() * 90000 + 10000),
    category,
    description: String(description).trim(),
    language,
    userId: req.authUser?.id || 'unknown',
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
  const ownComplaints = complaints.filter(ticket => ticket.userId === req.authUser?.id)
  res.json({ complaints: ownComplaints, total: ownComplaints.length })
})

export default router
