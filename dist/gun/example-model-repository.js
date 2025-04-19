import { GunRepository } from "./repository";
/**
 * Repository for managing Todo items
 * Extends the generic repository
 */
export class TodoRepository extends GunRepository {
    /**
     * Initializes the Todo repository
     * @param gun - GunDB instance
     * @param userScope - Whether to save data in user scope
     * @param encryptionKey - Optional encryption key
     */
    constructor(gun, userScope = true, encryptionKey) {
        super(gun, "todos", {
            userScope,
            useEncryption: !!encryptionKey,
            encryptionKey,
        });
    }
    /**
     * Finds completed Todo items
     * @returns Promise with array of completed Todos
     */
    async findCompleted() {
        const all = await this.findAll();
        return all.filter((todo) => todo.completed);
    }
    /**
     * Finds incomplete Todo items
     * @returns Promise with array of incomplete Todos
     */
    async findIncomplete() {
        const all = await this.findAll();
        return all.filter((todo) => !todo.completed);
    }
    /**
     * Marks a Todo item as completed
     * @param id - ID of the Todo
     * @returns Promise with operation result
     */
    async markAsCompleted(id) {
        return this.update(id, { completed: true });
    }
    /**
     * Marks a Todo item as incomplete
     * @param id - ID of the Todo
     * @returns Promise with operation result
     */
    async markAsIncomplete(id) {
        return this.update(id, { completed: false });
    }
    /**
     * Implementation of JSON to entity mapper
     */
    mapToEntity(data) {
        return {
            id: data.id,
            title: data.title || "",
            completed: Boolean(data.completed),
            createdAt: data.createdAt || Date.now(),
            userId: data.userId,
        };
    }
    /**
     * Implementation of entity to JSON mapper
     */
    mapToData(entity) {
        // Remove computed or unnecessary fields
        const { id, ...data } = entity;
        // Add current user ID if not specified
        // and if in userScope mode
        if (this.userScope && !data.userId) {
            data.userId = this.gun.getCurrentUser()?.pub;
        }
        return data;
    }
}
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
