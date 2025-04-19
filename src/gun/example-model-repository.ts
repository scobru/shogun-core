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
export class TodoRepository extends GunRepository<Todo> {
  /**
   * Initializes the Todo repository
   * @param gun - GunDB instance
   * @param userScope - Whether to save data in user scope
   * @param encryptionKey - Optional encryption key
   */
  constructor(gun: GunDB, userScope: boolean = true, encryptionKey?: any) {
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
  async findCompleted(): Promise<Todo[]> {
    const all = await this.findAll();
    return all.filter((todo) => todo.completed);
  }

  /**
   * Finds incomplete Todo items
   * @returns Promise with array of incomplete Todos
   */
  async findIncomplete(): Promise<Todo[]> {
    const all = await this.findAll();
    return all.filter((todo) => !todo.completed);
  }

  /**
   * Marks a Todo item as completed
   * @param id - ID of the Todo
   * @returns Promise with operation result
   */
  async markAsCompleted(id: string): Promise<boolean> {
    return this.update(id, { completed: true });
  }

  /**
   * Marks a Todo item as incomplete
   * @param id - ID of the Todo
   * @returns Promise with operation result
   */
  async markAsIncomplete(id: string): Promise<boolean> {
    return this.update(id, { completed: false });
  }

  /**
   * Implementation of JSON to entity mapper
   */
  protected mapToEntity(data: any): Todo {
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
  protected mapToData(entity: Todo): any {
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
