import { OpenAI } from 'openai';
import { z } from 'zod';
import { HttpAci } from '../../../dist';
import { findProjectByName, getProject } from '../domain/project.repository';
import { seedData } from './seed-data';

seedData();

const modelClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
})

const aci = new HttpAci({
    llmName: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    llmClient: modelClient,
})

const CreateProject = z.object({
    name: z.string(),
    tasks: z.array(z.string()).optional(),
})

const AddTask = z.object({
    projectId: z.string(),
    task: z.string(),
})

const CheckProjectStatus = z.object({
    projectId: z.string().optional(),
    projectName: z.string().optional(),
})


aci.intent('Create a project', CreateProject, async ({ utterance, entities }) => {
    console.log(utterance, entities)
})

aci.intent('Add task to a project', AddTask, async ({ utterance, entities }) => {
    console.log(utterance, entities)
})

aci.intent('Check status of a project', CheckProjectStatus, async ({ utterance, entities }) => {
    console.log(utterance, entities)

    let projectId = entities.projectId;

    if (entities.projectName) {
        const project = findProjectByName(entities.projectName)
        if (project) {
            projectId = project.id
        }
    }

    if (!projectId) {
        return 'I couldn\'t find a project with that name. Please try again.'
    }

    const project = getProject(projectId)

    if (!project) {
        return 'I couldn\'t find a project with that name. Please try again.'
    }

    return project
})

const port = Number.parseInt(process.env.PORT ?? '8080')

aci.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

