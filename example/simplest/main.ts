import { HttpAci } from '../../src/index';
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