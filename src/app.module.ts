import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdvancedSearchModule } from './advanced-search/advanced-search.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserThread } from './entities/user-thread.entity';
@Module({
  imports: [
    AdvancedSearchModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'boughani',
      password: 'boughani',
      database: 'test',
      entities: [UserThread],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([UserThread]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
