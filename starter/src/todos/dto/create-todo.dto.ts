import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TodoStatus } from '../entities/todo.entity';

export class CreateTodoDto {
  @IsString({ message: 'Tiêu đề (title) phải là một chuỗi ký tự' })
  @MinLength(3, { message: 'Tiêu đề (title) phải có ít nhất 3 ký tự' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Mô tả (description) phải là chuỗi ký tự' })
  description?: string;

  @IsOptional()
  @IsEnum(TodoStatus, {
    message: `Trạng thái phải là một trong: ${Object.values(TodoStatus).join(', ')}`,
  })
  status?: TodoStatus;
}
