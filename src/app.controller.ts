import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream } from 'fs';
import express, {Request, Response} from 'express';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post("")
  async handleThread(
    @Body('userId') userId: number,
    @Body('assistantId') assistantId: string,
  ) {
    const data = await this.appService.getOrCreateThread(userId, assistantId);
    return { data };
  }
  @Post("message")
  @UseInterceptors(FileInterceptor('file', {
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    const filePath:any = file ? join(__dirname, '..', 'uploads', file.filename) : null;
    const data = await this.appService.addMessageAndFileToThread(userId, assistantId, message, filePath);
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
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
}
