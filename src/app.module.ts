import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdvancedSearchModule } from './advanced-search/advanced-search.module';

@Module({
  imports: [AdvancedSearchModule],
  controllers: [AppController],
  providers: [AppService]
  
})
export class AppModule {}
