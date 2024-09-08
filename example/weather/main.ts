import { HttpAci } from '../../dist'
import { OpenAI } from 'openai'
import { z } from 'zod'

const modelClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
})

const aci = new HttpAci({
    llmName: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    llmClient: modelClient,
})

const CheckWeather = z.object({
    lat: z.number(),
    lng: z.number(),
})

aci.intent('Check the weather', CheckWeather, async ({ entities }) => {
    const { lat, lng } = entities

    const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
    return weather.json()
})

const port = Number.parseInt(process.env.PORT ?? '8080')

aci.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})


