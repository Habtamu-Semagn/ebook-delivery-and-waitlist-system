import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [
    FirebaseModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
      },
    }),
  ],
  controllers: [BooksController],
  providers: [BooksService]
})
export class BooksModule {}