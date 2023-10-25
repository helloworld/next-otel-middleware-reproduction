#!/bin/bash

# Start the Next.js app in development mode
# Redirect output to output.log
npm run build
npm run start > output.log 2>&1 &

# Get the process ID of the command we just ran.
PID=$!

# Wait for the server to start by looking for the log entry.
echo -n "Waiting for server to start..."
tail -f output.log | while read LOGLINE
do
   [[ "${LOGLINE}" == *"ready"* ]] && pkill -P $$ tail
   echo -n "."
done
echo ""

# Make API request
echo "Making API request..."
curl http://localhost:3000/api/hello

echo ""
echo "Done. Check output.log for the results."

# Kill the server
kill $(lsof -t -i:3000)

# Remove ANSI escape codes
sed -i '' 's/\x1b\[[0-9;]*m//g' output.log
