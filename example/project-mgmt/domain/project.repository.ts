import { Project } from "./project"

const Projects: Map<string, Project> = new Map()

export function saveProject(project: Project): void {
    Projects.set(project.id, project)
}

export function getProject(id: string): Project | null {
    return Projects.get(id) ?? null
}

export function findProjectByName(name: string): Project | null {
    for (const project of Projects.values()) {
        if (project.name.toLowerCase().includes(name.toLowerCase())) {
            return project
        }
    }
    return null
}