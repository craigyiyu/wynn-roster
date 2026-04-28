#!/bin/bash
cd ~/.openclaw/workspace/wynn-roster

echo "=== Data Pipeline Setup ==="

# 1. Check which pages exist
echo "Checking pages..."
ls client/src/pages/

# 2. Clone latest from GitHub if needed
echo "Updating from GitHub..."
git -C client pull origin main 2>/dev/null || git clone https://github.com/craigyiyu/wynn-roster.git /tmp/wynn-roster-new

# 3. Copy missing pages
echo "Copying missing pages..."
for page in ETLNormalization AIExtractionReview RosterGenerationFlow DemandSkills RotationView DataLineage EmployeeTrace RosterValidation RuleStudio; do
  if [ ! -f "client/src/pages/${page}.tsx" ]; then
    cp /tmp/wynn-roster-new/client/src/pages/${page}.tsx client/src/pages/ 2>/dev/null && echo "Copied ${page}"
  fi
done

# 4. Add routes to App.tsx
echo "Adding routes..."
# (routes should already be there from previous setup)

# 5. Copy lib files
echo "Copying lib files..."
for lib in databaseMockData mockData mockDataV2; do
  cp /tmp/wynn-roster-new/client/src/lib/${lib}.ts client/src/lib/ 2>/dev/null && echo "Copied ${lib}"
done

# 6. Build
echo "Building..."
npm run build 2>&1 | tail -5

# 7. Restart frontend
echo "Restarting frontend..."
fuser -k 3000/tcp 2>/dev/null
cd /tmp && node frontend.js > /tmp/frontend.log 2>&1 &
sleep 2

echo "=== Done ==="
curl -s http://localhost:3000 | grep "<title>"
