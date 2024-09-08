import { OpenAI } from 'openai';
import { zodFunction } from 'openai/helpers/zod';
import type { ChatCompletionCreateParams, ChatCompletionMessageParam } from 'openai/resources/index';
import { z, type AnyZodObject } from 'zod';
import type { AciConfig } from './aci-config';
import { MetadataFunctionParameters } from './common';
import { IntentHandler, IntentHandlerResponse, IntentSpec, ResponseFormat } from './types';

export const DEFAULT_TEMPERATURE = 0;
export const DEFAULT_SEED = 0;

const parseIntentPrompt = `
Analyze the following utterance and identify the intent, entities and any other relevant information. 
Then, call the appropriate tool.
If an output format is not specified, provide a textual response.
If a structured output is required, but no format is provided, use YAML as the default format.
If there is no tool to fulfill the intent, call the \`cannot_fulfill_intent\` tool with "Sorry, I don't have the capability to {fulfill the intent}.", still respecting the desired output format (if specified).
Don't improvise or make up a response.`

const formatResponsePrompt = (response_format: string, structured_schema?: string) => `
Fulfill the user's intent by providing a ${response_format} response.
${structured_schema ? `Use the following schema: ${structured_schema}` : ''}
`.trim()

export class ACI {
    private readonly llmName: string;
    private readonly llmClient: OpenAI;
    private readonly temperature: number;
    private readonly seed: number;
    private readonly maxTokens?: number;
    private readonly intents: Map<string, IntentSpec> = new Map()

    public constructor(config: AciConfig) {
        this.llmClient = config.llmClient ?? new OpenAI()
        this.llmName = config.llmName;
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
            parameters: definition.schema.merge(MetadataFunctionParameters)
        }))

        const body: ChatCompletionCreateParams = {
            model: this.llmName,
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

        let result = await this.llmClient.chat.completions.create(body);

        const toolCallMessage = result.choices[0].message
        let toolCallResults: ChatCompletionMessageParam[] = []

        let responseFormat: ResponseFormat = 'text:plain'
        let structuredSchema: string | undefined

        for (const toolCall of toolCallMessage.tool_calls ?? []) {
            const functionCall = toolCall.function
            if (!functionCall) {
                // shouldn't happen since we have a catch-all cannot_fulfill_intent
                console.debug(JSON.stringify(result.choices[0], null, 2))
                throw new Error('No intent definition found')
            }

            const intentSpec = this.intents.get(functionCall.name)
            if (!intentSpec) {
                // shouldn't happen 
                console.debug(JSON.stringify(functionCall, null, 2))
                throw new Error('Function not matching any intent definition')
            }

            const { intent, schema, handler } = intentSpec

            const entities: z.infer<typeof MetadataFunctionParameters> & z.infer<typeof schema> = JSON.parse(functionCall.arguments)

            let { response_format, structured_schema, message, ...rest } = entities

            if (intent === 'cannot_fulfill_intent') {
                return {
                    response_format,
                    output: entities.message!
                }
            }

            responseFormat ??= response_format
            structuredSchema ??= structured_schema
            const response = await handler({
                utterance, intent: intent, entities: rest
            })

            toolCallResults.push({
                role: 'tool', content: JSON.stringify(response), tool_call_id: toolCall.id!
            })
        }

        result = await this.llmClient.chat.completions.create({
            model: this.llmName,
            temperature: this.temperature,
            seed: this.seed,
            max_tokens: this.maxTokens,
            messages: [
                {
                    role: 'system', content: formatResponsePrompt(responseFormat, structuredSchema)
                },
                { role: "user", content: utterance },
                toolCallMessage,
                ...toolCallResults
            ],
        });

        return {
            response_format: responseFormat,
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