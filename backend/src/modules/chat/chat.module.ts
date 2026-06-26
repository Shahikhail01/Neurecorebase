import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ModelsModule } from '../models/models.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [ModelsModule, DatabaseModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}