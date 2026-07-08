import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@ApiTags('Books')
@Controller('books')
export class BooksController {
    constructor(private booksService: BooksService) {}

    @Get()
    @ApiOperation({ summary: 'Get all active books' })
    @ApiResponse({ status: 200, description: 'List of all books' })
    getAllBooks() {
        return this.booksService.getAllBooks();
    }

    @Get(':bookId')
    @ApiParam({ name: 'bookId', description: 'Book ID' })
    @ApiOperation({ summary: 'Get book details by ID' })
    @ApiResponse({ status: 200, description: 'Book details' })
    @ApiResponse({ status: 404, description: 'Book not found' })
    getBookById(@Param('bookId') bookId: string) {
        return this.booksService.getBookById(bookId);
    }

    @Post(':bookId/download')
    @UseGuards(FirebaseAuthGuard)
    @ApiBearerAuth('Firebase')
    @ApiParam({ name: 'bookId', description: 'Book ID' })
    @ApiOperation({ summary: 'Generate signed download URL for purchased book' })
    @ApiResponse({ status: 200, description: 'Signed download URL' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Book not found or not purchased' })
    async generateDownloadUrl(
        @Param('bookId') bookId: string,
        @Req() req: any,
    ) {
        return this.booksService.generateDownloadUrl(bookId, req.user.uid);
    }
}
