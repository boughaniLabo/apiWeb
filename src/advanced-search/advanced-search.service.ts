import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
const xml2js = require('xml2js');

@Injectable()
export class AdvancedSearchService {
    async searchArxiv(body): Promise<any> {
        const base_url = 'http://export.arxiv.org/api/query';
        const { query, author, max_results = 10, start = 0, sort_by = 'relevance', sort_order = 'descending' } = body;
        const pub_date = body.date
        // Validations
        console.log("author" , author);
        
    
        const params:any = {
          search_query: query ? query : "",
          start,
          max_results,
          sortBy: sort_by,
          sortOrder: sort_order,
        };
    
        // Additional parameters
   
        if (author) {
          params.author = author;
        }
        if (pub_date != "") {
          params.pub_date = pub_date;
        }
    
        try {
          const response: AxiosResponse = await axios.get(base_url, { params });
    
          if (response.status === 200) {
            // Parse the XML response
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(response.data);
    
            const entries = result.feed.entry;
    
            const results = entries.map(entry => ({
              title: entry.title[0],
              summary: entry.summary[0],
              link: entry.id[0],
              author:entry.author.map((author: any) => author.name[0]),
              source:"Arxiv"
            }));
    
            return results;
          } else {
            throw new Error(`Error: ${response.status}`);
          }
        } catch (error) {
          console.error('Error:', error.message);
          throw error;
        }
      }
      async serpapiRequest(body): Promise<any> {
        // Define your parameters
        const params: any = {
            engine: 'google_scholar',
            api_key: '303c3f9b40c1a37da4c3d858eecba9dc4c730f441e5616e0ca9d53bf2f0ba85e', // Get your API key from SerpApi
            q: body.query,
            num: 30 // Limiting to 30 results
        };
    
        const { author } = body;
        if (author) params.q = params.q + ", " + author;
        if (body.date) params.as_ylo = body.date;
        if (body.language) params.hl = body.language;
    
        try {
            // Make the request
            const response: AxiosResponse = await axios.get('https://serpapi.com/search', { params });
    
            if (response.status === 200) {
                // Extract required fields from each result
                const filteredResults = response.data.organic_results.filter(result => {
                    // Filter out Springer documents
                   // console.log(result?.resources ? result.resources[0] : '' );
                    if(result?.resources){
                      return !result?.resources[0]?.title.toLowerCase().includes('hal');

                    }else {
                      return true;
                    }

                });
    
                const formattedResults = filteredResults.map(result => {
                  console.log(result.publication_info.authors as []

                  )
                  let authorsType = result.publication_info.authors as [] ; 
                  let authors = []
                  if(authorsType){
                     authors = authorsType.map((author: any) => author.name);
                  }
                  return {
                    title: result.title,
                    summary: result.publication_info.summary,
                    link: result.link,
                    source: "google scholaire",
                    author: authors
                }}
              );
    
                return formattedResults;
            } else {
                throw new Error(`Error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }
    
    async  searchBooks(body: any): Promise<any[]> {
        const baseUrl = 'https://gutendex.com/books/';
        const { query, author, language } = body;
    
        try {
            const params:any= { search: query,maxResults : 10 };
            if (author) params.author = author;
            if (language) params.language = language;
            params.mime_type = "application/pdf";
    
            const response = await axios.get(baseUrl, { params });
            if (response.status === 200) {
                const { results } = response.data;
                
                const formattedResults = results.slice(0, 10).map((book: any) => {
                  let authorsType = book.authors as [] ; 
                  let authors = []
                  if(authorsType){
                     authors = authorsType.map((author: any) => author.name);
                  }
                  return {
                    title: book.title,
                    summary: book.subjects ? book.subjects.join(', ') : '', // Just an example of formatting summary
                    link: book.formats['application/pdf'] || book.formats['text/plain'] || '', // Example of choosing a format
                    source:"gutendex" , 
                    author: authors

                }});
                return formattedResults;
            } else {
                console.error('Error:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }
    async searchOpenLibrary(body) {
        const baseUrl = 'https://openlibrary.org/search.json';
        const { query, author, language } = body;
        const params:any = { q: query,limit:10 ,page:1};
        if (author) params.author = author;
        if (language) params.language = language;
    
        try {
          const response = await axios.get(baseUrl, { params });
          if (response.status === 200) {
            const data = response.data;
            if (data.docs) {
              const results = data.docs.map(book => ({
                title: book.title || 'Unknown Title',
                summary: book.subtitle || 'No summary available',
                link: `https://openlibrary.org${book.key}`,
                source:"OpenLibrary" ,
                author: book.author_name
              }));
              return results;
            }
          } else {
            console.error(`Error: ${response.status}`);
          }
        } catch (error) {
          console.error(`Error: ${error.message}`);
          throw error;
        }
      }
      async searchAll(body): Promise<any[]> {
        try {
          const [ serpapiResults,arxivResults, gutendexResults, openLibraryResults,googleBook] = await Promise.all([
            this.serpapiRequest(body),
            this.searchArxiv(body),
            this.searchBooks(body),
            this.searchOpenLibrary(body),
            this.searchBooksGoogle(body)
          ]);
    
          // Combine all results into one array
          const allResults = [ ...serpapiResults,...arxivResults, ...gutendexResults, ...openLibraryResults,...googleBook];
    
          return allResults;
        } catch (error) {
          console.error('Error:', error.message);
          throw error;
        }
      }
      async searchBooksGoogle(body: any): Promise<any> {
 
        const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
        const maxResults = 10;
        const { query} = body;
        const params:any= { q: query, maxResults : maxResults ,filter: 'free-ebooks'};
        if (body.author) params.author = body.author;
        try {
          const response = await axios.get(baseUrl, {
            params: {
             ...params            
            },
          });
    
          if (response.status === 200) {
            const { items } = response.data;
            if(items ){
              const results = items?.map(book => ({
                title: book.volumeInfo.title || 'Unknown Title',
                summary: book.volumeInfo.subtitle || 'No summary available',
                link: book.volumeInfo.previewLink,
                source: "Google Books" , 
                author: book.volumeInfo.authors
              }));
              return results;
            }else {
              return []
            }
          
            
          }
        } catch (error) {
          console.error('Error:', error.message);
          throw error;
        }
      }
    
}
