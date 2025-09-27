import express from 'express'
import request from 'supertest'

const buildApp = async () => {
  const app = express()
  app.use(express.json())
  const apiRouter = (await import('../../src/api')).default
  app.use('/api', apiRouter)
  return app
}

describe('Contract: POST /api/countries', () => {
  it('requires authentication (401) without token', async () => {
    const app = await buildApp()
    const res = await request(app).post('/api/countries').send({})
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ error: 'Unauthorized' })
  })
})

