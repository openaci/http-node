export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export class Task {
    public name: string
    public priority: TaskPriority
    public status: TaskStatus
    public dueDate?: Date

    constructor(name: string, priority: TaskPriority = 'medium', status: TaskStatus = 'todo', dueDate?: Date) {
        this.name = name
        this.priority = priority
        this.status = status
        this.dueDate = dueDate
    }
}
