import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DepartmentTemplatesService } from './department-templates.service';
import {
  CreateDepartmentTemplateDto,
  UpdateDepartmentTemplateDto,
} from './dto/department-template.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * DepartmentTemplatesController — /api/v1/department-templates
 *
 * SRP : Only handles HTTP routing and input/output shaping for dept templates.
 * ISP : Exposes only the endpoints this resource needs — no unrelated routes.
 *
 * All write operations are restricted to SuperAdmin.
 * GET (list + read) is accessible to any authenticated admin.
 */
@Controller({ path: 'department-templates', version: '1' })
export class DepartmentTemplatesController {
  constructor(private readonly service: DepartmentTemplatesService) {}

  // ─── List ───────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.SUPPORT)
  findAll(
    @Query('category') category?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.service.findAll({
      category,
      page: Number(page),
      limit: Number(limit),
    });
  }

  // ─── Read One ───────────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  // ─── Create ─────────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateDepartmentTemplateDto) {
    return this.service.create(dto);
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentTemplateDto,
  ) {
    return this.service.update(id, dto);
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
