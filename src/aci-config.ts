import type OpenAI from "openai";

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