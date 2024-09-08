import type { AnyZodObject, z } from "zod"
import type { ResponseFormat } from "./common"
import type { OpenAI } from "openai"

export type IntentSpec = {
    intent: string,
    schema: AnyZodObject,
    handler: IntentHandler<any>
}

export type ResponseFormat = z.infer<typeof ResponseFormat>

export type IntentHandlerResponse = {
    response_format: z.infer<typeof ResponseFormat>,
    output: string | Buffer
}

export type IntentHandler<T extends AnyZodObject> = (params: {
    utterance: string,
    intent: string,
    entities: z.infer<T>
}) => Promise<any>

/**
 * Configuration for the ACI class.
 */
export type AciConfig = {
    /**
     * The OpenAI client to use.
     * @default new OpenAI()
     */
    client?: OpenAI
    /**
     * The model to use.
     */
    model: string
    /**
     * The temperature to use.
     * @default 0
     */
    temperature?: number;
    /**
     * The seed to use.
     * @default 0
     */
    seed?: number;
    /**
     * The maximum number of tokens to use.
     * @default 100
     */
    maxTokens?: number;
    /**
     * The tool choice to use.
     * @default 'required'
     */
    toolChoice?: 'auto' | 'required' | 'none'
}