export class Milestone {
    public name: string
    public dueDate: Date

    constructor(name: string, dueDate: Date) {
        this.name = name
        this.dueDate = dueDate
    }
}