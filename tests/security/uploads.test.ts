import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('File Upload Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })

  test('Upload malicious file types', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading executable file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malicious.exe')
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('File type not allowed')
    
    // Test uploading script file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malicious.js')
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('File type not allowed')
    
    // Test uploading shell script
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malicious.sh')
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('File type not allowed')
    
    // Test uploading batch file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malicious.bat')
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('File type not allowed')
    
    // Test uploading PHP file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malicious.php')
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('File type not allowed')
  })

  test('Upload oversized files', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading file larger than 10MB
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/large-file.pdf')
    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('File size exceeds limit')
  })

  test('Upload files with malicious names', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading file with path traversal
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/../../../etc/passwd')
    await expect(page.locator('[data-testid="file-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-name-error"]')).toContainText('Invalid file name')
    
    // Test uploading file with null bytes
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/file\x00.pdf')
    await expect(page.locator('[data-testid="file-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-name-error"]')).toContainText('Invalid file name')
    
    // Test uploading file with special characters
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/file<script>alert("xss")</script>.pdf')
    await expect(page.locator('[data-testid="file-name-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-name-error"]')).toContainText('Invalid file name')
  })

  test('Upload files with malicious content', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading PDF with embedded JavaScript
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malicious-pdf.pdf')
    await expect(page.locator('[data-testid="file-content-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-content-error"]')).toContainText('File content not allowed')
    
    // Test uploading Word document with macros
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malicious-doc.docx')
    await expect(page.locator('[data-testid="file-content-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-content-error"]')).toContainText('File content not allowed')
  })

  test('Upload files with MIME type spoofing', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading executable with PDF MIME type
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/executable-disguised-as-pdf.pdf')
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('File type mismatch')
    
    // Test uploading image with executable content
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/executable-disguised-as-image.jpg')
    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('File type mismatch')
  })

  test('Upload files with embedded malware', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading file with embedded malware
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/malware-embedded.pdf')
    await expect(page.locator('[data-testid="file-content-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-content-error"]')).toContainText('Malicious content detected')
  })

  test('Upload files with SQL injection in metadata', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Fill form with SQL injection
    await page.fill('[data-testid="title-en"]', "'; DROP TABLE countries; --")
    await page.fill('[data-testid="title-ar"]', "'; DROP TABLE countries; --")
    await page.fill('[data-testid="description-en"]', "'; DROP TABLE countries; --")
    await page.fill('[data-testid="description-ar"]', "'; DROP TABLE countries; --")
    await page.fill('[data-testid="tags"]', "'; DROP TABLE countries; --")
    
    // Upload valid file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/valid-document.pdf')
    await page.waitForSelector('[data-testid="upload-complete"]')
    
    await page.click('[data-testid="confirm-upload"]')
    
    // Verify SQL injection was sanitized
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Verify database wasn't compromised
    await page.click('[data-testid="nav-countries"]')
    await expect(page.locator('[data-testid="country-list"]')).toBeVisible()
  })

  test('Upload files with XSS in metadata', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Fill form with XSS payload
    await page.fill('[data-testid="title-en"]', '<script>alert("XSS")</script>')
    await page.fill('[data-testid="title-ar"]', '<script>alert("XSS")</script>')
    await page.fill('[data-testid="description-en"]', '<img src=x onerror=alert("XSS")>')
    await page.fill('[data-testid="description-ar"]', '<img src=x onerror=alert("XSS")>')
    await page.fill('[data-testid="tags"]', '<script>alert("XSS")</script>')
    
    // Upload valid file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/valid-document.pdf')
    await page.waitForSelector('[data-testid="upload-complete"]')
    
    await page.click('[data-testid="confirm-upload"]')
    
    // Verify XSS was sanitized
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Verify no XSS was executed
    await expect(page.locator('script')).toHaveCount(0)
  })

  test('Upload files with path traversal in metadata', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Fill form with path traversal
    await page.fill('[data-testid="title-en"]', '../../../etc/passwd')
    await page.fill('[data-testid="title-ar"]', '../../../etc/passwd')
    await page.fill('[data-testid="description-en"]', '../../../etc/passwd')
    await page.fill('[data-testid="description-ar"]', '../../../etc/passwd')
    await page.fill('[data-testid="tags"]', '../../../etc/passwd')
    
    // Upload valid file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/valid-document.pdf')
    await page.waitForSelector('[data-testid="upload-complete"]')
    
    await page.click('[data-testid="confirm-upload"]')
    
    // Verify path traversal was sanitized
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Upload files with excessive metadata', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Fill form with excessive data
    const longString = 'A'.repeat(10000)
    await page.fill('[data-testid="title-en"]', longString)
    await page.fill('[data-testid="title-ar"]', longString)
    await page.fill('[data-testid="description-en"]', longString)
    await page.fill('[data-testid="description-ar"]', longString)
    await page.fill('[data-testid="tags"]', longString)
    
    // Upload valid file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/valid-document.pdf')
    await page.waitForSelector('[data-testid="upload-complete"]')
    
    await page.click('[data-testid="confirm-upload"]')
    
    // Verify excessive data was rejected
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Field length exceeds limit')
  })

  test('Upload files with invalid characters in metadata', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Fill form with invalid characters
    await page.fill('[data-testid="title-en"]', 'File\x00Name\x01With\x02Null\x03Bytes')
    await page.fill('[data-testid="title-ar"]', 'File\x00Name\x01With\x02Null\x03Bytes')
    await page.fill('[data-testid="description-en"]', 'File\x00Name\x01With\x02Null\x03Bytes')
    await page.fill('[data-testid="description-ar"]', 'File\x00Name\x01With\x02Null\x03Bytes')
    await page.fill('[data-testid="tags"]', 'File\x00Name\x01With\x02Null\x03Bytes')
    
    // Upload valid file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/valid-document.pdf')
    await page.waitForSelector('[data-testid="upload-complete"]')
    
    await page.click('[data-testid="confirm-upload"]')
    
    // Verify invalid characters were sanitized
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Upload files with concurrent requests', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    // Test multiple concurrent uploads
    const uploadPromises = []
    
    for (let i = 0; i < 5; i++) {
      uploadPromises.push(
        page.evaluate(async (index) => {
          const formData = new FormData()
          formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), `test-${index}.pdf`)
          formData.append('titleEn', `Test Document ${index}`)
          formData.append('titleAr', `وثيقة تجريبية ${index}`)
          formData.append('descriptionEn', `Test description ${index}`)
          formData.append('descriptionAr', `وصف تجريبي ${index}`)
          formData.append('category', 'document')
          formData.append('tags', `test, document, ${index}`)
          
          const response = await fetch('/api/data-library/upload', {
            method: 'POST',
            body: formData
          })
          
          return response.status
        }, i)
      )
    }
    
    const responses = await Promise.all(uploadPromises)
    
    // Verify all uploads were handled properly
    responses.forEach(status => {
      expect(status).toBe(201)
    })
  })

  test('Upload files with rate limiting', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    // Test rapid uploads to trigger rate limiting
    const uploadPromises = []
    
    for (let i = 0; i < 20; i++) {
      uploadPromises.push(
        page.evaluate(async (index) => {
          const formData = new FormData()
          formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), `test-${index}.pdf`)
          formData.append('titleEn', `Test Document ${index}`)
          formData.append('titleAr', `وثيقة تجريبية ${index}`)
          formData.append('descriptionEn', `Test description ${index}`)
          formData.append('descriptionAr', `وصف تجريبي ${index}`)
          formData.append('category', 'document')
          formData.append('tags', `test, document, ${index}`)
          
          const response = await fetch('/api/data-library/upload', {
            method: 'POST',
            body: formData
          })
          
          return response.status
        }, i)
      )
    }
    
    const responses = await Promise.all(uploadPromises)
    
    // Verify rate limiting was applied
    const successCount = responses.filter(status => status === 201).length
    const rateLimitedCount = responses.filter(status => status === 429).length
    
    expect(successCount).toBeGreaterThan(0)
    expect(rateLimitedCount).toBeGreaterThan(0)
  })

  test('Upload files with authentication bypass', async ({ page }) => {
    // Test upload without authentication
    const response = await page.evaluate(async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'test.pdf')
      formData.append('titleEn', 'Test Document')
      formData.append('titleAr', 'وثيقة تجريبية')
      formData.append('descriptionEn', 'Test description')
      formData.append('descriptionAr', 'وصف تجريبي')
      formData.append('category', 'document')
      formData.append('tags', 'test, document')
      
      const response = await fetch('/api/data-library/upload', {
        method: 'POST',
        body: formData
      })
      
      return response.status
    })
    
    // Verify authentication is required
    expect(response).toBe(401)
  })

  test('Upload files with authorization bypass', async ({ page }) => {
    // Login as non-admin user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'user@gastat.gov.sa')
    await page.fill('[data-testid="password"]', 'user123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Try to upload restricted file type
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/restricted-document.pdf')
    await expect(page.locator('[data-testid="permission-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="permission-error"]')).toContainText('Insufficient permissions')
  })

  test('Upload files with CSRF protection', async ({ page }) => {
    // Test upload without CSRF token
    const response = await page.evaluate(async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'application/pdf' }), 'test.pdf')
      formData.append('titleEn', 'Test Document')
      formData.append('titleAr', 'وثيقة تجريبية')
      formData.append('descriptionEn', 'Test description')
      formData.append('descriptionAr', 'وصف تجريبي')
      formData.append('category', 'document')
      formData.append('tags', 'test, document')
      
      const response = await fetch('/api/data-library/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-Token': 'invalid-token'
        }
      })
      
      return response.status
    })
    
    // Verify CSRF protection is working
    expect(response).toBe(403)
  })

  test('Upload files with file size validation', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading empty file
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/empty-file.pdf')
    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('File is empty')
    
    // Test uploading file with minimum size
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/minimum-size.pdf')
    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('File too small')
  })

  test('Upload files with virus scanning', async ({ page }) => {
    await page.click('[data-testid="nav-data-library"]')
    await page.waitForURL('/data-library')
    
    await page.click('[data-testid="upload-button"]')
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible()
    
    // Test uploading file with virus signature
    await page.setInputFiles('[data-testid="file-upload"]', 'test-files/virus-infected.pdf')
    await expect(page.locator('[data-testid="virus-detected"]')).toBeVisible()
    await expect(page.locator('[data-testid="virus-detected"]')).toContainText('Virus detected')
    
    // Verify file was quarantined
    await expect(page.locator('[data-testid="quarantine-notice"]')).toBeVisible()
  })
})