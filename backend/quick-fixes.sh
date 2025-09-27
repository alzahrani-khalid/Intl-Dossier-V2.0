#!/bin/bash

echo "🔧 Applying quick fixes to remaining TypeScript errors..."

# Fix events.ts validation issue
sed -i '' 's/validate(createEventSchema)/validate({ body: createEventSchema })/g' src/api/events.ts

# Fix events.ts attendee type
sed -i '' 's/attendees.map((attendee)/attendees.map((attendee: any)/g' src/api/events.ts

# Fix relationships.ts method name
sed -i '' 's/calculateHealth/calculateHealthScore/g' src/api/relationships.ts

# Fix TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "allowJs": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

echo "✅ Quick fixes applied"