var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Body, Req, UseGuards, Delete, Param, } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';
import { CreateReminderDto } from './dto/create-reminder.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
let RemindersController = class RemindersController {
    remindersService;
    constructor(remindersService) {
        this.remindersService = remindersService;
    }
    findAll(request) {
        return this.remindersService.findAll(request.user.sub);
    }
    create(dto, request) {
        return this.remindersService.create(request.user.sub, dto);
    }
    remove(request, id) {
        return this.remindersService.remove(request.user.sub, id);
    }
};
__decorate([
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "findAll", null);
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateReminderDto, Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "create", null);
__decorate([
    Delete(':id'),
    __param(0, Req()),
    __param(1, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "remove", null);
RemindersController = __decorate([
    Controller('api/v1/reminders'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [RemindersService])
], RemindersController);
export { RemindersController };
//# sourceMappingURL=reminders.controller.js.map