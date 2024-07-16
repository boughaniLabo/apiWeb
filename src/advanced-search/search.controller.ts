import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { AdvancedSearchService } from './advanced-search.service';


@Controller('search')
export class SearchController {
    constructor(private _searchService:AdvancedSearchService){
    }
    @Post('/')
    async search(@Body() body:any){
        console.log(body);
        
        const data = await this._searchService.searchAll(body)
        return data
    }
    @Get('/searchs')
    async getSearchResults(@Query('query') query: string, @Query('location') location: string, @Query('engine') engine: string) {
        try {
          const response = await this._searchService.fetchResults(query, location, engine);
          return response;
        } catch (error) {
          throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
}
