import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo, TodoStatus } from './entities/todo.entity';

@Injectable()
export class TodosService {
  // Kho lưu trữ tạm thời trong RAM (In-memory storage) phục vụ bài lab
  private todos: Todo[] = [
    {
      id: 1,
      title: 'Học NestJS Request Lifecycle',
      description: 'Nắm vững thứ tự Middleware -> Guard -> Interceptor -> Pipe -> Filter',
      status: TodoStatus.IN_PROGRESS,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      title: 'Làm bài tập Hands-on Lab',
      description: 'Tự tay viết Guard, Interceptor và Exception Filter',
      status: TodoStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  findAll(): Todo[] {
    return this.todos;
  }

  findOne(id: number): Todo {
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) {
      throw new NotFoundException(`Không tìm thấy công việc với ID = ${id}`);
    }
    return todo;
  }

  create(createTodoDto: CreateTodoDto): Todo {
    const nextId =
      this.todos.length > 0
        ? Math.max(...this.todos.map((t) => t.id)) + 1
        : 1;

    const newTodo: Todo = {
      id: nextId,
      title: createTodoDto.title,
      description: createTodoDto.description,
      status: createTodoDto.status ?? TodoStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.todos.push(newTodo);
    return newTodo;
  }

  /**
   * Endpoint giả lập tác vụ chậm (chờ 300ms)
   * Phục vụ kiểm chứng LoggingInterceptor đo lường độ trễ
   */
  async slowEndpoint(): Promise<{ message: string; delay: number }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      message: 'Tác vụ đã hoàn thành sau độ trễ 300ms',
      delay: 300,
    };
  }

  /**
   * Endpoint giả lập lỗi code crash bất ngờ (throw Error thuần)
   * Phục vụ kiểm chứng ExceptionFilter bắt lỗi 500 và giấu stack trace
   */
  triggerError(): never {
    throw new Error('Lỗi kết nối cơ sở dữ liệu nội bộ!');
  }
}
