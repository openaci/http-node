import { OpenAI } from 'openai';
import { zodFunction } from 'openai/helpers/zod.mjs';
import type { ChatCompletionCreateParams } from 'openai/resources/index.mjs';
import { z, type AnyZodObject } from 'zod';
import type { AciConfig } from './aci-config';
import type { IntentHandler } from './intent-handler';

export const DEFAULT_TEMPERATURE = 0;
export const DEFAULT_SEED = 0;

type IntentDefinition = {
    intent: string,
    schema: AnyZodObject,
    handler: IntentHandler<any>
}

type IntentEntities = Record<string, unknown> & {
    output_format?: 'text' | 'structured' | 'image' | 'audio'
    structured_format?: string,
    structured_schema?: string
    message?: string;
}

type IntentHandlerResponse = {
    output_format: 'text' | 'structured' | 'image' | 'audio',
    structured_format?: string,
    output: string,
}


const parseIntentPrompt = `
Analyze the following utterance and identify the intent, entities and any other relevant information. 
Then, call the appropriate tool.
If an output format is not specified, provide a textual response.
If a structured output is required, but no format is provided, use YAML as the default format.
If there is no tool to fulfill the intent, call the \`cannot_fulfill_intent\` tool with "Sorry, I don't have the capability to {fulfill the intent}.", still respecting the desired output format (if specified).
Don't improvise or make up a response.`


export class ACI {
    private readonly client: OpenAI;
    private readonly model: string;
    private readonly temperature: number;
    private readonly seed: number;
    private readonly maxTokens?: number;
    private readonly intents: Map<string, IntentDefinition> = new Map()

    public constructor(config: AciConfig) {
        this.client = config.client ?? new OpenAI()
        this.model = config.model;
        this.temperature = config.temperature ?? DEFAULT_TEMPERATURE;
        this.seed = config.seed ?? DEFAULT_SEED;
        this.maxTokens = config.maxTokens;
        this.intents.set('cannot_fulfill_intent', {
            intent: 'cannot_fulfill_intent',
            schema: z.object({
                message: z.string()
            }),
            handler: async () => { }
        })
    }

    public intent<T extends AnyZodObject>(intent: string, schema: T, handler: IntentHandler<T>) {
        const functionName = this.toSnakeCase(intent)
        this.intents.set(functionName, { intent, schema, handler })
    }

    public async handle(utterance: string): Promise<IntentHandlerResponse> {
        const tools = Array.from(this.intents.entries()).map(([functionName, definition]) => zodFunction({
            name: functionName,
            parameters: definition.schema.merge(z.object({
                output_format: z.enum(['text', 'structured', 'image', 'audio']),
                structured_format: z.string().optional(),
                structured_schema: z.string().optional()
            }))
        }))

        const body: ChatCompletionCreateParams = {
            model: this.model,
            temperature: this.temperature,
            seed: this.seed,
            max_tokens: this.maxTokens,
            messages: [
                { role: 'system', content: parseIntentPrompt },
                { role: "user", content: utterance }
            ],
            tools,
            tool_choice: 'required',
        }

        let result = await this.client.chat.completions.create(body);

        let intent: IntentDefinition | undefined;
        let entities: IntentEntities = {}
        let response;

        const toolCallMessage = result.choices[0].message
        const functionCall = toolCallMessage.tool_calls?.[0].function
        if (functionCall) {
            intent = this.intents.get(functionCall.name)
            entities = JSON.parse(functionCall.arguments)
        }

        if (!functionCall || !intent) {
            // shouldn't happen since we have a catch-all cannot_fulfill_intent
            console.debug(JSON.stringify(result.choices[0], null, 2))
            throw new Error('No intent definition found')
        }

        // @ts-ignore
        let { output_format, structured_format, structured_schema, ...rest } = entities

        if (output_format === 'structured') {
            structured_format ??= 'yaml'
        }

        if (intent.intent === 'cannot_fulfill_intent') {
            console.debug(JSON.stringify(result.choices[0], null, 2))
            return {
                output_format: output_format!,
                structured_format: structured_format!,
                output: entities.message!
            }
        }

        response = await intent.handler({
            utterance, intent: intent.intent, entities: rest
        })

        if (output_format === 'image') {
            const image = await this.client.images.generate({
                model: 'dall-e-3',
                prompt: `${utterance}. Here's the information you need: ${JSON.stringify(response)}`,
                n: 1,
                response_format: 'b64_json',
                size: '1024x1024',
            })

            return {
                output_format,
                output: image.data[0].b64_json!
            }
        }

        const systemPrompt = `
        Fulfill the user's intent by providing a ${output_format} response${output_format === 'structured' ? ` in ${structured_format} format` : ''}.
        ${structured_schema ? `Use the following schema: ${structured_schema}` : ''}
                `.trim()

        result = await this.client.chat.completions.create({
            model: this.model,
            temperature: this.temperature,
            seed: this.seed,
            max_tokens: this.maxTokens,
            messages: [
                {
                    role: 'system', content: systemPrompt
                },
                { role: "user", content: utterance },
                toolCallMessage,
                { role: 'tool', content: JSON.stringify(response), tool_call_id: toolCallMessage.tool_calls?.[0].id! }
            ],
        });

        return {
            output_format: output_format!,
            structured_format: structured_format!,
            output: result.choices[0].message.content!
        }
    }

    private toSnakeCase(str: string): string {
        return str
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }
}