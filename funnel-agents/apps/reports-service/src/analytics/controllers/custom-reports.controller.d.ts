import { CustomReportService } from '../services/custom-report.service';
import { CustomReportDto, CustomReportResultDto } from '../dto/custom-report.dto';
export declare class CustomReportsController {
    private readonly customReportService;
    constructor(customReportService: CustomReportService);
    generateCustomReport(dto: CustomReportDto): Promise<CustomReportResultDto>;
}
