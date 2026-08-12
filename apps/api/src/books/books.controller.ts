import { Controller, Get, Param, Post, Req, UseGuards, Body, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { AdminGuard } from 'src/guards/admin.guard';

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

    @Get('category/:categorySlug')
    @ApiParam({ name: 'categorySlug', description: 'Category slug' })
    @ApiOperation({ summary: 'Get books by category' })
    @ApiResponse({ status: 200, description: 'List of books in category' })
    getBooksByCategory(@Param('categorySlug') categorySlug: string) {
        return this.booksService.getBooksByCategory(categorySlug);
    }

    @Get(':bookId')
    @ApiParam({ name: 'bookId', description: 'Book ID (UUID format)' })
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
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const clientIp = Array.isArray(ip) ? ip[0] : ip;
        return this.booksService.generateDownloadUrl(bookId, req.user.uid, clientIp);
    }

    @Post('upload')
    @UseGuards(AdminGuard)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'file', maxCount: 1 },
        { name: 'image', maxCount: 1 }
    ]))
    @ApiBearerAuth('Firebase')
    @ApiOperation({ summary: 'Upload a new book with optional cover image (Admin only)' })
    @ApiResponse({ status: 201, description: 'Book uploaded successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
    async uploadBook(
        @UploadedFiles() files: { file?: Express.Multer.File[], image?: Express.Multer.File[] },
        @Body() body: { title: string; description: string; author: string; price: string; category: string },
    ) {
        if (!files.file || !files.file[0]) {
            throw new BadRequestException('PDF file is required');
        }

        const { title, description, author, price, category } = body;

        if (!title || !description || !author || !price || !category) {
            throw new BadRequestException('All fields are required');
        }

        const imageFile = files.image?.[0];

        return this.booksService.uploadBook(
            files.file[0], 
            { title, description, author, price: parseFloat(price), category },
            imageFile
        );
    }
}
