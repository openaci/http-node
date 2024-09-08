import { Milestone } from "../domain/milestone"
import { Project } from "../domain/project"
import { saveProject } from "../domain/project.repository"
import { Task } from "../domain/task"

export const seedData = () => {
    // seed projects
    const paypal = new Project('PayPal integration')
    paypal.addTask(new Task('Implement PayPal checkout'))
    saveProject(paypal)

    const mobileApp = new Project('Mobile App')
    mobileApp.addTask(new Task('Design Welcome Screen', 'high', 'in_progress'))
    mobileApp.addTask(new Task('Create user authentication system', 'high', 'todo'))
    mobileApp.addTask(new Task('Develop offline mode functionality', 'medium', 'in_progress'))
    mobileApp.addTask(new Task('Implement push notifications', 'medium', 'todo'))
    mobileApp.addTask(new Task('Optimize app performance', 'high', 'todo'))
    mobileApp.addTask(new Task('Conduct user testing', 'medium', 'todo'))
    mobileApp.addTask(new Task('Fix bugs', 'medium', 'in_progress'))
    mobileApp.addMilestone(new Milestone('Beta Release', new Date(new Date().setDate(new Date().getDate() + 10))))
    saveProject(mobileApp)
}