import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream } from 'fs';
import express, {Request, Response} from 'express';
import { UserThread } from './entities/user-thread.entity';
import { threadId } from 'worker_threads';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('')
  async handleThread(
    @Body('userId') userId: number,
    @Body('assistantId') assistantId: string,
  ) {
    const data = await this.appService.getOrCreateThread(userId, assistantId);
    console.log(data);
    return { data };
  }
  @Post("/message")
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
  }))
  async addMessage(
    @Body('userId') userId: number,
    @Body('assistantId') assistantId: string,
    @Body('message') message: string,
    @Body('threadId') threadId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const filePath:any = file ? join(__dirname, '..', 'uploads', file.filename) : null;
    const data = await this.appService.addMessageAndFileToThread(userId, assistantId, message, filePath,threadId);
    return { data };
  }
  @Get('download/:id')
  async getFileById(@Param('id') id: string,@Res() res: Response ) {
    const fileId = id ; 
    const filename = await this.appService.getFileById(fileId);
    const filePath = join(__dirname, '..', 'public', filename);
    const fileStream = createReadStream(filePath);

    fileStream.on('error', (err) => {
      console.error(err);
      return res.status(404).send('File not found');
    });

    // Map file extensions to MIME types
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.json': 'application/json',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Add more as needed
    };

    const ext = extname(filename).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentType,
    });

    fileStream.pipe(res);
  }

  /*@Post('/thread')
  async createThread(
    @Body('userId') userId: number,
    @Body('assistantId') assistantId: string,
  ): Promise<any> {
    const createdThread = await this.appService.createThread(
      userId,
      assistantId,
    );
    return { message: 'Thread created successfully', thread: createdThread };
  }*/

  @Get('/thread/:userId')
  async getThreadsByUserId(
    @Param('userId') userId: number,
  ): Promise<UserThread[]> {
    return this.appService.getThreadsByUserId(userId);
  }

  /*@Get('/thread/:assistantId')
  async getThreadsByAssistant(
    @Param('assistantID') assistantID: string,
  ): Promise<UserThread[]> {
    return this.appService.getThreadsByAssistantId(assistantID);
  }*/

  @Delete('/thread/:threadId')
  async deleteUserThread(
    @Param('threadId') threadId: string,
    @Body('userId') userId: number,
    @Res() res,
  ): Promise<void> {
    try {
      const deleted = await this.appService.deleteUserThread(userId, threadId);
      if (deleted) {
        res.status(HttpStatus.OK).json({
          message: 'Thread deleted successfully',
        });
      } else {
        res.status(HttpStatus.NOT_FOUND).json({
          message: 'Thread not found',
        });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete thread',
        error: error.message,
      });
    }
  }

  @Post('/thread/:id/message')
  async createMessageThread(
    @Param('id') id: number,
    @Body('message') message: string,
  ): Promise<string> {
    return this.appService.createMessage(id, message);
  }

  @Get('/thread/:threadId/message')
  async getMessages(@Param('threadId') threadId: string, @Body('userId') userId:number): Promise<any> {
    return this.appService.getMessages(threadId,userId);
  }

  @Post('/thread/create-get-thread')
  async createGetThread(
    @Body('userId') userId: number,
    @Body('threadId') threadId: string,
    @Body('assistantId') assistantId: string,
    @Body('message') message?: string,
  ): Promise<any> {
    return this.appService.createGetThread(
      userId,
      threadId,
      assistantId,
      message,
    );
  }

  @Post('/thread/:assistantId')
  async getThreadsByUserAndAssistant(
    @Param('assistantId') assistantId: string,
    @Body('userId') userId: number,
  ): Promise<UserThread[]> {
    return this.appService.getThreadsByUserAndAssistant(userId, assistantId);
  }
}
