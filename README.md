
**Application Conversational Interfaces** (ACIs) introduce a new paradigm, in a way comparable to what GraphQL was for RPC or RESTful APIs, but in this case proposing something entirely different to replace the term “API”.

We can enumerate a few radically different points when compared to APIs:

1. ACIs don't have a fixed or pre-established contract, schema, methods or a precise workflow. They are **intent-based** rather than **procedural call-based**.

2. These interfaces put humans as the main consumer, **without making a distinction** whether they are **end-users** or **developers**.

3. With the previous point in mind, **accessibility** is an important aspect of ACIs. Not only for inclusivity but also for convenience. ACIs are **multi-language** and **multi-modal**.

4. As LLMs continue evolving and AI agents perform better at reasoning, they will also qualify as consumers of ACIs. In this sense, we can iterate over the concept and think of a consumer as anybody capable of interacting with these interfaces **using natural language.**

5. Reached this point, LLM-backed clients would interact with ACIs almost autonomously. This would enable a scenario of distributed multi-agentic systems. 

## Quick Start

```bash
npm install @openaci/http zod
```

```tsx
// main.js
import { HttpAci } from '@openaci/http';
import { z } from 'zod';

const app = new HttpAci({ llmName: 'gpt-4o-mini' });

const schema = z.object({
    name: z.string(),
});

app.intent('Convert name to base64', schema, async ({ entities }) => {
    const { name } = entities;

    return Buffer.from(name).toString('base64');
});

app.listen(3000);
```

```bash
node main.js

# Simple call, can be made by a user or by an ACI client
curl -XPOST http://localhost:3000 -d "How does my name look like in base64? It's John"
Your name "John" in base64 is: Sm9obg==

# Call with a structured response that can be used by an ACI client
curl -XPOST http://localhost:3000 -d "Write a JSON document with `code: {base64 of 'OpenACI'}`"
{"code":"T3BlbkFDSQ=="}

# Call with a JSON request body and a JSON response – no different to a normal JSON API
curl -XPOST http://localhost:3000 -d '{"intent":"convertToBase64","name":"OpenACI"}'
{"name":"OpenACI","base64":"T3BlbkFDSQ=="}

# Call with multiple parameters (ACI calls the intent handler multiple times)
curl -XPOST http://localhost:3000 -d "Show me an ascii table with the base64 representation of these names: John Connor, Sarah Connor, Kyle Reese"
| Name          | Base64                |
|---------------|-----------------------|
| John Connor   | Sm9obiBDb25ub3I=     |
| Sarah Connor  | U2FyYWggQ29ubm9y     |
| Kyle Reese    | S3lsZSBSZWVzZQ==     |
```
