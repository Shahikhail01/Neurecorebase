import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  ForbiddenException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './services/departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TierLimit } from '../../common/decorators/tier-limit.decorator';
import { TierLimitsGuard } from '../../common/guards/tier-limits.guard';
import { resolveTenantContext } from '../../common/utils/resolve-tenant-context';
import { assertSameTenant } from '../../common/utils/assert-same-tenant';
import type { JwtPayload } from '../auth/interfaces/token.interface';
import { UserRole } from '@prisma/client';

@Controller({ path: 'departments', version: '1' })
@UseGuards(TierLimitsGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  private resolveTenantId(user: JwtPayload, tenantId?: string): string {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!tenantId)
        throw new BadRequestException('tenantId is required for SUPER_ADMIN');
      return tenantId;
    }
    if (!user.tenantId) throw new ForbiddenException('Tenant context required');
    return user.tenantId;
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.departmentsService.findAll(
      this.resolveTenantId(user, tenantId),
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    // Phase 0 (FIX-007): canonical tenant-context + defense-in-depth check.
    const ctx = resolveTenantContext(user, { query: { tenantId } });
    const dept = await this.departmentsService.findOne(id, ctx.tenantId);
    assertSameTenant(user, (dept as { tenantId?: string | null })?.tenantId, {
      resourceType: 'department',
      resourceId: id,
    });
    return dept;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @TierLimit('maxDepartments')
  create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    const effectiveTenantId = dto.tenantId ?? tenantId;
    return this.departmentsService.create({
      ...dto,
      tenantId: this.resolveTenantId(user, effectiveTenantId),
    });
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.departmentsService.update(
      id,
      this.resolveTenantId(user, tenantId),
      dto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.departmentsService.remove(
      id,
      this.resolveTenantId(user, tenantId),
    );
  }
}
