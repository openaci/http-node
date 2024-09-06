import { HttpAci } from '@openaci/http'
import { z } from 'zod'

const aci = new HttpAci({ model: 'gpt-4o-mini' })

const CheckWeather = z.object({
    lat: z.number(),
    lng: z.number(),
})

aci.intent('check the weather', CheckWeather, async ({ utterance, entities }) => {
    console.log(utterance, entities)

    const { lat, lng } = entities

    const weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
    const weatherData = await weather.json()

    return weatherData
})

aci.listen(3080, () => {
    console.log('Server is running on port 3080')
})


