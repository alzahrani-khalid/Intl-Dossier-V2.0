# Error Codes: AI Brief Generation

**Feature Branch**: `033-ai-brief-generation`

## Error Code Format

All AI-related errors follow the format: `AI_<CATEGORY>_<SPECIFIC>`

## Error Codes

### Infrastructure Errors (AI*INFRA*\*)

| Code                         | HTTP Status | Description                      | User Message (EN)                                                | User Message (AR)                                                |
| ---------------------------- | ----------- | -------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| `AI_INFRA_UNAVAILABLE`       | 503         | AI service is unavailable        | "AI service is temporarily unavailable. Please try again later." | "خدمة الذكاء الاصطناعي غير متوفرة مؤقتاً. يرجى المحاولة لاحقاً." |
| `AI_INFRA_EMBEDDINGS_FAILED` | 500         | BGE-M3 embeddings service failed | "Unable to process your request. Please try again."              | "تعذر معالجة طلبك. يرجى المحاولة مرة أخرى."                      |
| `AI_INFRA_REDIS_UNAVAILABLE` | 503         | Redis cache unavailable          | "Service temporarily degraded. Please try again."                | "الخدمة متدهورة مؤقتاً. يرجى المحاولة مرة أخرى."                 |

### Provider Errors (AI*PROVIDER*\*)

| Code                           | HTTP Status | Description                    | User Message (EN)                                       | User Message (AR)                                               |
| ------------------------------ | ----------- | ------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------- |
| `AI_PROVIDER_RATE_LIMITED`     | 429         | LLM provider rate limit hit    | "Too many requests. Please wait {retry_after} seconds." | "طلبات كثيرة جداً. يرجى الانتظار {retry_after} ثانية."          |
| `AI_PROVIDER_TIMEOUT`          | 504         | LLM provider request timeout   | "Request timed out. Please try again."                  | "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى."                     |
| `AI_PROVIDER_UNAVAILABLE`      | 503         | LLM provider is down           | "AI provider temporarily unavailable."                  | "مزود الذكاء الاصطناعي غير متاح مؤقتاً."                        |
| `AI_PROVIDER_INVALID_RESPONSE` | 502         | Invalid response from provider | "Unable to process AI response. Please try again."      | "تعذر معالجة استجابة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى." |

### Policy Errors (AI*POLICY*\*)

| Code                              | HTTP Status | Description                                       | User Message (EN)                                                    | User Message (AR)                                                         |
| --------------------------------- | ----------- | ------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `AI_POLICY_SPEND_CAP_REACHED`     | 503         | Organization monthly spend cap reached            | "AI usage limit reached for this month. Contact your administrator." | "تم الوصول إلى حد استخدام الذكاء الاصطناعي لهذا الشهر. تواصل مع المسؤول." |
| `AI_POLICY_FEATURE_DISABLED`      | 403         | AI feature is disabled for organization           | "This AI feature is not enabled for your organization."              | "هذه الميزة غير مفعلة لمؤسستك."                                           |
| `AI_POLICY_PRIVATE_LLM_REQUIRED`  | 503         | Secret data requires private LLM, but unavailable | "Unable to process sensitive data. Private AI service required."     | "تعذر معالجة البيانات الحساسة. يلزم خدمة الذكاء الاصطناعي الخاصة."        |
| `AI_POLICY_CLASSIFICATION_DENIED` | 403         | Data classification prevents cloud processing     | "This data cannot be processed by cloud AI services."                | "لا يمكن معالجة هذه البيانات بواسطة خدمات الذكاء الاصطناعي السحابية."     |

### Brief Generation Errors (AI*BRIEF*\*)

| Code                             | HTTP Status | Description                                          | User Message (EN)                                                                             | User Message (AR)                                                                          |
| -------------------------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `AI_BRIEF_INSUFFICIENT_DATA`     | 400         | Not enough source data for brief                     | "Limited data available for this engagement. Please add more context to related dossiers."    | "البيانات المتاحة محدودة لهذا الارتباط. يرجى إضافة المزيد من السياق للملفات ذات الصلة."    |
| `AI_BRIEF_TIMEOUT_PARTIAL`       | 200         | Brief generation timed out, partial results returned | "Brief generation timed out. Partial results shown. You can regenerate for a complete brief." | "انتهت مهلة إنشاء الملخص. تظهر النتائج الجزئية. يمكنك إعادة الإنشاء للحصول على ملخص كامل." |
| `AI_BRIEF_GENERATION_FAILED`     | 500         | Brief generation failed                              | "Unable to generate brief. Please try again."                                                 | "تعذر إنشاء الملخص. يرجى المحاولة مرة أخرى."                                               |
| `AI_BRIEF_ENGAGEMENT_NOT_FOUND`  | 404         | Engagement not found                                 | "Engagement not found."                                                                       | "لم يتم العثور على الارتباط."                                                              |
| `AI_BRIEF_CONFLICTING_POSITIONS` | 200         | Generated but conflicting positions detected         | "Brief generated. Note: Conflicting positions were detected and highlighted."                 | "تم إنشاء الملخص. ملاحظة: تم اكتشاف مواقف متضاربة وتم تمييزها."                            |

### Chat Errors (AI*CHAT*\*)

| Code                       | HTTP Status | Description                    | User Message (EN)                                                      | User Message (AR)                                   |
| -------------------------- | ----------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------- |
| `AI_CHAT_MESSAGE_TOO_LONG` | 400         | Message exceeds maximum length | "Message is too long. Maximum {max_length} characters."                | "الرسالة طويلة جداً. الحد الأقصى {max_length} حرف." |
| `AI_CHAT_SESSION_EXPIRED`  | 400         | Chat session has expired       | "Chat session expired. Starting a new conversation."                   | "انتهت جلسة المحادثة. بدء محادثة جديدة."            |
| `AI_CHAT_TOOL_FAILED`      | 500         | Tool execution failed          | "Unable to retrieve information. Please try rephrasing your question." | "تعذر استرداد المعلومات. يرجى إعادة صياغة سؤالك."   |

### Entity Linking Errors (AI*LINK*\*)

| Code                         | HTTP Status | Description               | User Message (EN)                                               | User Message (AR)                                       |
| ---------------------------- | ----------- | ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| `AI_LINK_PROPOSAL_NOT_FOUND` | 404         | Link proposal not found   | "Link proposal not found."                                      | "لم يتم العثور على اقتراح الربط."                       |
| `AI_LINK_PROPOSAL_EXPIRED`   | 400         | Link proposal has expired | "This suggestion has expired. Please generate new suggestions." | "انتهت صلاحية هذا الاقتراح. يرجى إنشاء اقتراحات جديدة." |
| `AI_LINK_ALREADY_EXISTS`     | 409         | Link already exists       | "This link already exists."                                     | "هذا الرابط موجود بالفعل."                              |
| `AI_LINK_INTAKE_NOT_FOUND`   | 404         | Intake ticket not found   | "Intake ticket not found."                                      | "لم يتم العثور على تذكرة الاستلام."                     |

### Validation Errors (AI*VALIDATION*\*)

| Code                             | HTTP Status | Description                 | User Message (EN)                                     | User Message (AR)                                 |
| -------------------------------- | ----------- | --------------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| `AI_VALIDATION_INVALID_UUID`     | 400         | Invalid UUID format         | "Invalid ID format provided."                         | "تنسيق المعرّف المقدم غير صالح."                  |
| `AI_VALIDATION_MISSING_REQUIRED` | 400         | Missing required field      | "Missing required field: {field_name}"                | "حقل مطلوب مفقود: {field_name}"                   |
| `AI_VALIDATION_PROMPT_TOO_LONG`  | 400         | Custom prompt exceeds limit | "Custom prompt is too long. Maximum 2000 characters." | "التوجيه المخصص طويل جداً. الحد الأقصى 2000 حرف." |

## Error Response Format

All API errors return the following JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "AI_POLICY_SPEND_CAP_REACHED",
    "message": "AI usage limit reached for this month. Contact your administrator.",
    "details": {
      "current_spend": 485.5,
      "monthly_cap": 500.0,
      "reset_date": "2025-01-01T00:00:00Z"
    },
    "retry_after": null
  }
}
```

## HTTP Status Code Mapping

| Status | Usage                                             |
| ------ | ------------------------------------------------- |
| 200    | Success (including partial results with warnings) |
| 400    | Client error (validation, bad request)            |
| 403    | Permission/policy denied                          |
| 404    | Resource not found                                |
| 409    | Conflict (duplicate)                              |
| 429    | Rate limited                                      |
| 500    | Server error                                      |
| 502    | Bad gateway (provider issues)                     |
| 503    | Service unavailable (caps, private LLM down)      |
| 504    | Gateway timeout                                   |

## Retryable Errors

The following errors are retryable with exponential backoff:

- `AI_PROVIDER_RATE_LIMITED` - Retry after `retry_after` seconds
- `AI_PROVIDER_TIMEOUT` - Retry up to 3 times
- `AI_PROVIDER_UNAVAILABLE` - Retry up to 3 times with 5s base delay
- `AI_INFRA_REDIS_UNAVAILABLE` - Retry up to 2 times

## Frontend Error Handling

```typescript
// Example error handling pattern
interface AIErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retry_after?: number;
}

function getLocalizedError(error: AIErrorResponse, locale: 'en' | 'ar'): string {
  // Look up error message in i18n files
  return t(`ai-errors.${error.code}`, {
    ...error.details,
    lng: locale,
  });
}

function isRetryable(code: string): boolean {
  return [
    'AI_PROVIDER_RATE_LIMITED',
    'AI_PROVIDER_TIMEOUT',
    'AI_PROVIDER_UNAVAILABLE',
    'AI_INFRA_REDIS_UNAVAILABLE',
  ].includes(code);
}
```
