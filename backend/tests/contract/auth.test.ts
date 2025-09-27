import express from 'express'
import request from 'supertest'

// Build an isolated app that mounts only the API router
const buildApp = async () => {
  const app = express()
  app.use(express.json())
  const apiRouter = (await import('../../src/api')).default
  app.use('/api', apiRouter)
  return app
}

describe('Contract: POST /api/auth/login', () => {
  it('returns 400 on invalid payload (missing password)', async () => {
    const app = await buildApp()
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com' })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: 'Validation Error' })
    expect(Array.isArray(res.body.details)).toBe(true)
  })

  it('accepts test credentials in test mode and returns user payload', async () => {
    // AuthService supports a built-in test shortcut when NODE_ENV is test
    process.env.NODE_ENV = 'test'
    const app = await buildApp()
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@gastat.gov.sa', password: 'admin123' })

    expect(res.status).toBe(200)
    // Contract: at minimum a user object is returned
    expect(res.body).toHaveProperty('user')
    expect(res.body.user).toHaveProperty('email', 'admin@gastat.gov.sa')
  })
})

describe('Contract: POST /api/auth/verify-mfa', () => {
  it('returns 400 on invalid payload', async () => {
    const app = await buildApp()
    // Missing userId and code
    const res = await request(app).post('/api/auth/verify-mfa').send({})
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ error: 'Validation Error' })
  })
})

