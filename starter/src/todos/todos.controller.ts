import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { TodosService } from './todos.service';

// BƯỚC 1: Sau khi hoàn thành AuthGuard, bạn sẽ gắn @UseGuards(AuthGuard) lên Controller này!
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll() {
    return this.todosService.findAll();
  }

  @Get('slow-endpoint')
  slowEndpoint() {
    return this.todosService.slowEndpoint();
  }

  @Get('trigger-error')
  triggerError() {
    return this.todosService.triggerError();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.findOne(id);
  }

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }
}
