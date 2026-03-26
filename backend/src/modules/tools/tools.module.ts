import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { StructuredToolRegistry } from './structured-tool.registry';
import { HttpRequestTool } from './built-in/http-request.tool';
import { CalculatorTool } from './built-in/calculator.tool';
import { CalculatorEnhancedTool } from './built-in/calculator-enhanced.tool';
import { HttpRequestEnhancedTool } from './built-in/http-request-enhanced.tool';

@Module({
  controllers: [ToolsController],
  providers: [
    HttpRequestTool,
    CalculatorTool,
    CalculatorEnhancedTool,
    HttpRequestEnhancedTool,
    ToolsService,
    StructuredToolRegistry,
  ],
  exports: [ToolsService, StructuredToolRegistry],
})
export class ToolsModule {}
