1. don't write documentation unless explicitly told do. no incessant generation of markdown files, summary files, txt, etc. just do one thing and do it well: write the code

2. don't run any build commmands, as those interrupt with my dev commands and make me have to restart my application. don't run until you're told to run and verify code

3. don't bother with git. i'll handle it myself. just write the code.
### ⚠️ CRITICAL PROHIBITION: Unauthrorized Backend/Database Modifications
- **DO NOT** write, execute, or attempt to run independent scripts (Node.js, Python, Bash, etc.) to modify remote backend database schemas, metadata, or server configurations unless explicitly commanded to do so by the user.
- When debugging client-side API errors (such as Appwrite "Unknown attribute" or schema mismatch errors), assume the backend is the source of truth. Your job is to align the client payload, SDK usage, or local generated types to match the backend, **not** to forcefully migrate the backend to match the client.
- **NEVER** search for or attempt to use server-side API keys, admin credentials, or `node-appwrite` administrative methods to bypass client-side limitations while tasked with a frontend or client SDK issue.
