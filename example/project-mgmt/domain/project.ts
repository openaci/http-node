import { Milestone } from "./milestone"
import { Task } from "./task"

export class Project {
    public id: string
    public name: string
    public tasks: Task[]
    public milestones: Milestone[]

    constructor(name: string) {
        this.id = Date.now().toString()
        this.name = name
        this.tasks = []
        this.milestones = []
    }

    public addTask(task: Task) {
        this.tasks.push(task)
    }

    public addMilestone(milestone: Milestone) {
        this.milestones.push(milestone)
    }
}
