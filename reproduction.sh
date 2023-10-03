#!/bin/bash

# Start the Next.js app in development mode
# Redirect output to output.log
npm run dev > output.log 2>&1 &

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
curl http://localhost:3000/api/hello

# Kill the server
kill $PID
