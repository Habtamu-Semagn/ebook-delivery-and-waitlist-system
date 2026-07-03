import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';

@Controller('books')
export class BooksController {
    constructor(private booksService: BooksService) {}

    @Get()
    getAllBooks() {
        return this.booksService.getAllBooks();
    }

    @Post(':bookId/download')
    @UseGuards(FirebaseAuthGuard)
    async generateDownloadUrl(
        @Param('bookId') bookId: string,
        @Req() req: any,
    ) {
        return this.booksService.generateDownloadUrl(bookId, req.user.uid);
    }
}
