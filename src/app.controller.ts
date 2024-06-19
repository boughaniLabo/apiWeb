import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

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
  @Post('message')
  async addMessage(
    @Body('userId') userId: number,
    @Body('assistantId') assistantId: string,
    @Body('message') message: string,
  ) {
    const data = await this.appService.addMessageToThread(userId, assistantId, message);
    return { data };
  }
  @Get('file')
  getFileById(@Param('id') id: string, ): any {
    const fileId = id ; 
    const file = this.appService.getFileById(fileId);
    return file  
  }
}
