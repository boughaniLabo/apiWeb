import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { AdvancedSearchService } from './advanced-search.service';

@Module({
  controllers: [SearchController],
  providers: [AdvancedSearchService]
})
export class AdvancedSearchModule {}
