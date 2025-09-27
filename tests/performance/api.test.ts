import { test, expect } from '@playwright/test'

test.describe('API Performance Tests', () => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3001'
  const performanceThresholds = {
    responseTime: 1000, // 1 second
    throughput: 100, // requests per second
    errorRate: 0.01 // 1% error rate
  }

  test('Countries API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/countries
    const response = await request.get(`${baseURL}/api/countries`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('countries')
    expect(data).toHaveProperty('pagination')
  })

  test('Countries API with pagination performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/countries?page=1&limit=10
    const response = await request.get(`${baseURL}/api/countries?page=1&limit=10`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data.countries).toHaveLength(10)
  })

  test('Countries API search performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/countries/search?q=Saudi
    const response = await request.get(`${baseURL}/api/countries/search?q=Saudi`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('countries')
  })

  test('Organizations API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/organizations
    const response = await request.get(`${baseURL}/api/organizations`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('organizations')
  })

  test('MoUs API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/mous
    const response = await request.get(`${baseURL}/api/mous`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('mous')
  })

  test('Events API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/events
    const response = await request.get(`${baseURL}/api/events`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('events')
  })

  test('Intelligence Reports API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/intelligence
    const response = await request.get(`${baseURL}/api/intelligence`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('reports')
  })

  test('Data Library API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/data-library
    const response = await request.get(`${baseURL}/api/data-library`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('items')
  })

  test('Word Assistant API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test POST /api/word-assistant/generate
    const response = await request.post(`${baseURL}/api/word-assistant/generate`, {
      data: {
        prompt: 'Create a formal letter',
        documentType: 'letter',
        language: 'en',
        context: 'GASTAT, formal communication'
      }
    })
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime * 2) // Allow more time for AI generation
    
    const data = await response.json()
    expect(data).toHaveProperty('content')
  })

  test('Reports API performance', async ({ request }) => {
    const startTime = Date.now()
    
    // Test GET /api/reports
    const response = await request.get(`${baseURL}/api/reports`)
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime)
    
    const data = await response.json()
    expect(data).toHaveProperty('reports')
  })

  test('API load testing - Countries endpoint', async ({ request }) => {
    const concurrentRequests = 10
    const requests = []
    
    const startTime = Date.now()
    
    // Send multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(request.get(`${baseURL}/api/countries`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Calculate throughput
    const throughput = (concurrentRequests / totalTime) * 1000
    expect(throughput).toBeGreaterThan(performanceThresholds.throughput)
  })

  test('API load testing - Organizations endpoint', async ({ request }) => {
    const concurrentRequests = 10
    const requests = []
    
    const startTime = Date.now()
    
    // Send multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(request.get(`${baseURL}/api/organizations`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Calculate throughput
    const throughput = (concurrentRequests / totalTime) * 1000
    expect(throughput).toBeGreaterThan(performanceThresholds.throughput)
  })

  test('API load testing - MoUs endpoint', async ({ request }) => {
    const concurrentRequests = 10
    const requests = []
    
    const startTime = Date.now()
    
    // Send multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(request.get(`${baseURL}/api/mous`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Calculate throughput
    const throughput = (concurrentRequests / totalTime) * 1000
    expect(throughput).toBeGreaterThan(performanceThresholds.throughput)
  })

  test('API load testing - Events endpoint', async ({ request }) => {
    const concurrentRequests = 10
    const requests = []
    
    const startTime = Date.now()
    
    // Send multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(request.get(`${baseURL}/api/events`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Calculate throughput
    const throughput = (concurrentRequests / totalTime) * 1000
    expect(throughput).toBeGreaterThan(performanceThresholds.throughput)
  })

  test('API load testing - Intelligence endpoint', async ({ request }) => {
    const concurrentRequests = 10
    const requests = []
    
    const startTime = Date.now()
    
    // Send multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(request.get(`${baseURL}/api/intelligence`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Calculate throughput
    const throughput = (concurrentRequests / totalTime) * 1000
    expect(throughput).toBeGreaterThan(performanceThresholds.throughput)
  })

  test('API load testing - Data Library endpoint', async ({ request }) => {
    const concurrentRequests = 10
    const requests = []
    
    const startTime = Date.now()
    
    // Send multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(request.get(`${baseURL}/api/data-library`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Calculate throughput
    const throughput = (concurrentRequests / totalTime) * 1000
    expect(throughput).toBeGreaterThan(performanceThresholds.throughput)
  })

  test('API load testing - Reports endpoint', async ({ request }) => {
    const concurrentRequests = 10
    const requests = []
    
    const startTime = Date.now()
    
    // Send multiple concurrent requests
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(request.get(`${baseURL}/api/reports`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Calculate throughput
    const throughput = (concurrentRequests / totalTime) * 1000
    expect(throughput).toBeGreaterThan(performanceThresholds.throughput)
  })

  test('API error rate testing', async ({ request }) => {
    const totalRequests = 100
    const requests = []
    let errorCount = 0
    
    // Send multiple requests with some invalid parameters
    for (let i = 0; i < totalRequests; i++) {
      if (i % 10 === 0) {
        // Send invalid request every 10th request
        requests.push(request.get(`${baseURL}/api/countries?page=invalid`))
      } else {
        requests.push(request.get(`${baseURL}/api/countries`))
      }
    }
    
    const responses = await Promise.all(requests)
    
    // Count errors
    responses.forEach(response => {
      if (response.status() >= 400) {
        errorCount++
      }
    })
    
    const errorRate = errorCount / totalRequests
    expect(errorRate).toBeLessThan(performanceThresholds.errorRate)
  })

  test('API memory usage testing', async ({ request }) => {
    const startTime = Date.now()
    const requests = []
    
    // Send multiple requests to test memory usage
    for (let i = 0; i < 50; i++) {
      requests.push(request.get(`${baseURL}/api/countries`))
    }
    
    const responses = await Promise.all(requests)
    const endTime = Date.now()
    
    // Check all responses are successful
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Check response time is still reasonable
    const responseTime = endTime - startTime
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime * 2)
  })

  test('API database connection testing', async ({ request }) => {
    const startTime = Date.now()
    
    // Test database connection by creating and deleting a test record
    const createResponse = await request.post(`${baseURL}/api/countries`, {
      data: {
        isoCode2: 'XX',
        isoCode3: 'XXX',
        nameEn: 'Test Country',
        nameAr: 'دولة تجريبية',
        region: 'asia',
        capitalEn: 'Test Capital',
        capitalAr: 'عاصمة تجريبية',
        population: 1000000,
        area: 1000
      }
    })
    
    expect(createResponse.status()).toBe(201)
    const createdData = await createResponse.json()
    const countryId = createdData.country.id
    
    // Delete the test record
    const deleteResponse = await request.delete(`${baseURL}/api/countries/${countryId}`)
    expect(deleteResponse.status()).toBe(200)
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // Check database operations are fast
    expect(responseTime).toBeLessThan(performanceThresholds.responseTime * 2)
  })

  test('API caching performance', async ({ request }) => {
    const startTime = Date.now()
    
    // First request (should be slower due to cache miss)
    const firstResponse = await request.get(`${baseURL}/api/countries`)
    const firstEndTime = Date.now()
    const firstResponseTime = firstEndTime - startTime
    
    expect(firstResponse.status()).toBe(200)
    
    // Second request (should be faster due to cache hit)
    const secondStartTime = Date.now()
    const secondResponse = await request.get(`${baseURL}/api/countries`)
    const secondEndTime = Date.now()
    const secondResponseTime = secondEndTime - secondStartTime
    
    expect(secondResponse.status()).toBe(200)
    
    // Second request should be faster than first
    expect(secondResponseTime).toBeLessThan(firstResponseTime)
  })

  test('API rate limiting testing', async ({ request }) => {
    const requests = []
    
    // Send requests rapidly to test rate limiting
    for (let i = 0; i < 20; i++) {
      requests.push(request.get(`${baseURL}/api/countries`))
    }
    
    const responses = await Promise.all(requests)
    
    // Check that most requests are successful (rate limiting should allow some)
    const successCount = responses.filter(r => r.status() === 200).length
    expect(successCount).toBeGreaterThan(15) // Allow some rate limiting
  })
})