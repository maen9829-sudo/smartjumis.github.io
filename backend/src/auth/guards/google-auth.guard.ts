import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Used to initiate Google OAuth flow: @UseGuards(GoogleAuthGuard)
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
