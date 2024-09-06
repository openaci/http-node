import type { AnyZodObject, z } from "zod"

export type IntentHandler<T extends AnyZodObject> = (params: {
    utterance: string,
    intent: string,
    entities: z.infer<T>
}) => Promise<any>
