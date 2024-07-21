import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserThread } from './entities/user-thread.entity';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import fs, { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { createReadStream } from 'fs';
import * as mime from 'mime-types';
import { dirname, join } from 'path';

@Injectable()
export class AppService {
  private openai;
  constructor(
    @InjectRepository(UserThread)
    private userThreadRepository: Repository<UserThread>,
  ) {
    this.openai = new OpenAI({
      apiKey: '',
    });
  }

  async getOrCreateThread(
    userId: number,
    assistantId: string,
  ): Promise<UserThread> {
    let userThread: any = await this.userThreadRepository.findOne({
      where: { userId, assistantId },
    });
    if (!userThread) {
      const newThread = await this.openai.beta.threads.create();
      userThread = this.userThreadRepository.create({
        userId,
        threadId: newThread.id,
        assistantId,
      });
      await this.userThreadRepository.save(userThread);
    }

    return userThread;
  }
  async createThread(  userId: number,
    assistantId: string,){
      const newThread = await this.openai.beta.threads.create();
      let userThread = this.userThreadRepository.create({
        userId,
        threadId: newThread.id,
        assistantId,
      });
     return  await this.userThreadRepository.save(userThread);

  }
  async getFileType(filePath: string): Promise<string | null> {
    try {
      const mimeType = mime.lookup(filePath);
      return mimeType ? mimeType : null;
    } catch (error) {
      console.error('Error determining file type:', error);
      return null;
    }
  }
  async isImageType(mimeType: string): Promise<boolean> {
    return mimeType ? mimeType.startsWith('image') : false;
  }
  async addMessageAndFileToThread(
    userId: number,
    assistantId: string,
    message: string,
    filePath: string,
    threadId:string
  ): Promise<any> {
    let userThread:any ; 
    console.log("loggggggggg",threadId);
    
    if(threadId){
      console.log("loggggggggg",threadId);
       userThread = await this.userThreadRepository.findOne({
        where: { userId, assistantId , threadId },
      });
      if(!userThread){
      throw new NotFoundException(`No thread here`);
      }
      userThread = await this.getOrCreateThread(userId, assistantId);
    }else {
      userThread = await this.createThread(userId, assistantId);
    }
     
    console.log(userThread);
    
 
    const content = [];
    let attachement = null;

    if (filePath) {
      /** 
      const mimeType = await this.getFileType(filePath);
      const isImage = await this.isImageType(mimeType)
*/
      const fileStream = createReadStream(filePath);
      /** 
      if (isImage) {
        const uploadedFile = await this.openai.files.create({
          file: fileStream,
          purpose:"vision"
        });
        content.push({
          type: 'image_file',
          image_file: { file_id: uploadedFile.id },
        });
      } else {
       */
      const uploadedFile = await this.openai.files.create({
        file: fileStream,
        purpose: 'assistants',
      });
      attachement = [
        {
          file_id: uploadedFile.id,
          tools: [{ type: 'code_interpreter' }],
        },
      ];
      //}

      // Clean up the file after uploading
      unlinkSync(filePath);
    }

    if (message) {
      content.push({
        type: 'text',
        text: message,
      });
    }

    if (content.length > 0) {
      await this.openai.beta.threads.messages.create(userThread.threadId, {
        role: 'user',
        content,
        attachments: attachement ? attachement : null,
      });
    }

    const run = await this.openai.beta.threads.runs.createAndPoll(
      userThread.threadId,
      {
        assistant_id: assistantId,
      },
    );

    const threadMessages = await this.openai.beta.threads.messages.list(
      userThread.threadId,
      {
        run_id: run.id,
      },
    );

    return threadMessages.data;
  }

  async getFileById(fileId: string) {
    try {
      const response = await this.openai.files.content(fileId);
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        .split(';')
        .find((n) => n.includes('filename='))
        ?.replace('filename=', '')
        .trim()
        .replace(/"/g, ''); // Clean up quotes

      const blob = await response.blob();
      console.log(filename);
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Specify a "path" in the filename
      const savePath = join(__dirname, '..', 'public', filename);
      const dirPath = dirname(savePath);
      console.log(dirPath);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }

      // Download the file
      writeFileSync(savePath, buffer);

      console.log(`File saved to ${savePath}`);

      // Define the public URL where the file can be accessed
      const publicPath = `http://yourdomain.com/file/${filename}`;

      console.log(`File can be downloaded from: ${publicPath}`);
      return filename; // Return the public path for downloading
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(error);
    }
  }
  /*async createThread(userId: number, assistantId: string): Promise<UserThread> {
    const newThread = await this.openai.beta.threads.create();
    const userThread = this.userThreadRepository.create({
      userId,
      threadId: newThread.id,
      assistantId,
    });
    await this.userThreadRepository.save(userThread);
    return userThread;
  }*/


  async getThreadsByUserId(userId: number): Promise<UserThread[]> {
    return this.userThreadRepository.find({ where: { userId } });
  }

  async getThreadsByAssistantId(assistantId: string): Promise<UserThread[]> {
    return this.userThreadRepository.find({ where: { assistantId } });
  }

  async deleteUserThread(userId: number, threadId: string): Promise<boolean> {
    const thread = await this.userThreadRepository.findOne({
      where: { userId, threadId },
    });

    if (thread) {
      try {
        await this.openai.beta.threads.del(threadId);
        await this.userThreadRepository.delete(thread.id);
        return true;
      } catch (error) {
        console.error('Error deleting user thread:', error);
        return false;
      }
    }

    return false;
  }

  async createMessage(id: number, message: string): Promise<string> {
    const thread = await this.userThreadRepository.findOne({ where: { id } });
    if (thread) {
      try {
        const response = await this.openai.beta.threads.messages.create(
          thread.threadId,
          {
            role: 'user',
            content: message,
          },
        );

        return response;
      } catch (err) {
        throw new Error('Error creating message');
      }
    } else {
      throw new Error('Thread not found');
    }
  }

  async getMessages(id: number): Promise<any> {
    const thread = await this.userThreadRepository.findOne({ where: { id } });

    if (thread) {
      try {
        const response = await this.openai.beta.threads.messages.list(
          thread.threadId,
        );
        return response;
      } catch (err) {
        throw new Error(err.message);
      }
    }
  }

  async createGetThread(
    userId: number,
    threadId: string,
    assistantId: string,
    message?: string,
  ): Promise<any> {
    let thread = await this.userThreadRepository.findOne({
      where: { userId, threadId, assistantId },
    });

    if (!thread) {
      const newThread = await this.openai.beta.threads.create();

      thread = this.userThreadRepository.create({
        userId,
        threadId: newThread.id,
        assistantId,
      });
      await this.userThreadRepository.save(thread);
    }

    if (message) {
      const responseMessage = await this.openai.beta.threads.messages.create(
        thread.threadId,
        {
          role: 'user',
          content: message,
        },
      );

      return {
        thread,
        responseMessage,
      };
    }

    return thread;
  }

  async getThreadsByUserAndAssistant(
    userId: number,
    assistantId: string,
  ): Promise<UserThread[]> {
    const threads = this.userThreadRepository.find({
      where: { userId, assistantId },
    });

    if (!threads) {
      return [];
    }

    return threads;
  }
}
