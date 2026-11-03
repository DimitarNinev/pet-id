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
import { Controller, Get, Req, UseGuards, } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
let RemindersController = class RemindersController {
    remindersService;
    constructor(remindersService) {
        this.remindersService = remindersService;
    }
    findAll(request) {
        return this.remindersService.findAll(request.user.sub);
    }
};
__decorate([
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "findAll", null);
RemindersController = __decorate([
    Controller('api/v1/reminders'),
    UseGuards(JwtAuthGuard),
    __metadata("design:paramtypes", [RemindersService])
], RemindersController);
export { RemindersController };
//# sourceMappingURL=reminders.controller.js.map