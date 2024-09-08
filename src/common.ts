import z from "zod"

export const ResponseFormat = z.enum([
    'text:plain',
    'text:base64',
    'text:markdown',
    'structured:csv',
    'structured:json',
    'structured:yaml',
    'structured:xml',
    'structured:html',
    'structured:mermaid',
    'audio:mp3',
])

export const MetadataFunctionParameters = z.object({
    response_format: ResponseFormat,
    structured_schema: z.string().optional().describe('The schema for the structured output. Only used if response_format is structured.'),
    message: z.string().optional()
})