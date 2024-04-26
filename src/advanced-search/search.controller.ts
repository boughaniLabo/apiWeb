import { Body, Controller, Param, Post } from '@nestjs/common';
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
}
