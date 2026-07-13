import express, { type Request, type Response } from 'express'
import { request, type Server } from 'node:http'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { paginationSchema, validate } from '../validation'

describe('validate', () => {
  it('shadows the Express 5 query getter with the enumerable parsed query', async () => {
    const app = express()
    const req = Object.assign(Object.create(app.request) as Request, {
      url: '/?page=2&limit=5',
    })
    const next = vi.fn()

    await validate({ query: paginationSchema })(req, {} as Response, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
    expect(req.query).toEqual({ page: 2, limit: 5, order: 'asc' })
    expect(Object.getOwnPropertyDescriptor(req, 'query')).toMatchObject({
      writable: true,
      enumerable: true,
      configurable: true,
    })
    expect(Object.keys(req.query)).toEqual(expect.arrayContaining(['page', 'limit']))
    expect({ ...req.query }).toEqual({ page: 2, limit: 5, order: 'asc' })
  })

  it('keeps body and params on their plain assignment paths', async () => {
    const app = express()
    const req = Object.create(app.request) as Request
    req.body = { count: '2' }
    req.params = { id: '3' }
    const next = vi.fn()

    await validate({
      body: z.object({ count: z.coerce.number() }),
      params: z.object({ id: z.coerce.number() }),
    })(req, {} as Response, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ count: 2 })
    expect(req.params).toEqual({ id: 3 })
  })

  it('passes the coerced query through a real Express route', async () => {
    const app = express()
    app.get('/validated', validate({ query: paginationSchema }), (req, res) => res.json(req.query))
    const server = await new Promise<Server>((resolve) => {
      const listener = app.listen(0, () => resolve(listener))
    })

    try {
      const address = server.address()
      if (address == null || typeof address === 'string') throw new Error('Expected a TCP address')

      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const clientRequest = request(
          {
            hostname: '127.0.0.1',
            port: address.port,
            path: '/validated?page=2&limit=5',
          },
          (serverResponse) => {
            let body = ''
            serverResponse.setEncoding('utf8')
            serverResponse.on('data', (chunk) => (body += chunk))
            serverResponse.on('end', () =>
              resolve({ status: serverResponse.statusCode ?? 0, body }),
            )
          },
        )
        clientRequest.on('error', reject)
        clientRequest.end()
      })

      expect(response.status).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ page: 2, limit: 5, order: 'asc' })
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error == null ? resolve() : reject(error))),
      )
    }
  })
})
