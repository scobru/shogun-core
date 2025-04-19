import { GunRepository } from "./repository";
import { GunDB } from "./gun";
/**
 * Example domain model for a Todo item
 */
interface Todo {
    id?: string;
    title: string;
    completed: boolean;
    createdAt: number;
    userId?: string;
}
/**
 * Repository for managing Todo items
 * Extends the generic repository
 */
export declare class TodoRepository extends GunRepository<Todo> {
    /**
     * Initializes the Todo repository
     * @param gun - GunDB instance
     * @param userScope - Whether to save data in user scope
     * @param encryptionKey - Optional encryption key
     */
    constructor(gun: GunDB, userScope?: boolean, encryptionKey?: any);
    /**
     * Finds completed Todo items
     * @returns Promise with array of completed Todos
     */
    findCompleted(): Promise<Todo[]>;
    /**
     * Finds incomplete Todo items
     * @returns Promise with array of incomplete Todos
     */
    findIncomplete(): Promise<Todo[]>;
    /**
     * Marks a Todo item as completed
     * @param id - ID of the Todo
     * @returns Promise with operation result
     */
    markAsCompleted(id: string): Promise<boolean>;
    /**
     * Marks a Todo item as incomplete
     * @param id - ID of the Todo
     * @returns Promise with operation result
     */
    markAsIncomplete(id: string): Promise<boolean>;
    /**
     * Implementation of JSON to entity mapper
     */
    protected mapToEntity(data: any): Todo;
    /**
     * Implementation of entity to JSON mapper
     */
    protected mapToData(entity: Todo): any;
}
export {};
/**
 * Usage example:
 *
 * const gun = GunDB.withPeers(["https://gun-server.example.com/gun"]);
 * const todoRepo = new TodoRepository(gun);
 *
 * // Create
 * const id = await todoRepo.save({
 *   title: "Complete documentation",
 *   completed: false,
 *   createdAt: Date.now()
 * });
 *
 * // Read
 * const todo = await todoRepo.findById(id);
 *
 * // Update
 * await todoRepo.update(id, { title: "New title" });
 *
 * // Search
 * const incompleteTodos = await todoRepo.findIncomplete();
 *
 * // Delete
 * await todoRepo.remove(id);
 */
