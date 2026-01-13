# Fonts Directory

## Noto Sans Arabic Font

**Required for PDF generation with Arabic RTL support**

### Download Instructions

1. Download Noto Sans Arabic from Google Fonts:
   - URL: https://fonts.google.com/noto/specimen/Noto+Sans+Arabic
   - Or direct: https://github.com/notofonts/arabic/releases

2. Extract and place the following file in this directory:

   ```
   NotoSansArabic-Regular.ttf
   ```

3. Optional additional weights:
   ```
   NotoSansArabic-Bold.ttf
   NotoSansArabic-SemiBold.ttf
   ```

### Usage

The font is registered in the PDF generation Edge Function:

```typescript
import { Font } from '@react-pdf/renderer'

Font.register({
  family: 'Noto Sans Arabic',
  src: '/fonts/NotoSansArabic-Regular.ttf',
})
```

### License

Noto Sans Arabic is licensed under the SIL Open Font License 1.1
See: https://scripts.sil.org/OFL
