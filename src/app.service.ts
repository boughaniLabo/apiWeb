import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserThread } from './entitys/user-thread.entity';
import { Repository } from 'typeorm';
import OpenAI from 'openai';

@Injectable()
export class AppService {
  private openai;
  constructor(
    @InjectRepository(UserThread)
    private userThreadRepository: Repository<UserThread>,
  ) {
    this.openai = new OpenAI({apiKey:""});
  }

  async getOrCreateThread(userId: number, assistantId: string): Promise<string> {
    let userThread = await this.userThreadRepository.findOne({ where: { userId, assistantId } });

    if (!userThread) {
      const newThread = await this.openai.beta.threads.create();
      userThread = this.userThreadRepository.create({
        userId,
        threadId: newThread.id,
        assistantId,
      });
      await this.userThreadRepository.save(userThread);
    }

    return userThread.threadId;
  }
  async addMessageToThread(userId: number, assistantId: string, message: string): Promise<any> {
    let userThread:any = await this.userThreadRepository.findOne({ where: { userId, assistantId } });
    console.log("#########",userId,assistantId,message,userThread);
    if (!userThread) {
      userThread = await this.getOrCreateThread(userId,assistantId)
    }

    await this.openai.beta.threads.messages.create(userThread.threadId, {
      role: "user",
      content: message,
    });

    const run = await this.openai.beta.threads.runs.createAndPoll(userThread.threadId, {
      assistant_id: assistantId,
    });

    const messages = await this.openai.beta.threads.messages.list(userThread.threadId, {
      run_id: run.id,
    });
    return messages.data;
  }
    async  getFileById(fileId){
    const file = await this.openai.files.content(fileId);
    return file ; 

  }

}

