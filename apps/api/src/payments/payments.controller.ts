import { Controller, Post } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';

@Controller('payments')
export class PaymentsController {
    constructor(private reconciliationService: ReconciliationService) {}
}
