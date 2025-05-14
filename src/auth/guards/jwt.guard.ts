/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // To get JWT secret
import { Request } from 'express'; // Assuming Express is the underlying platform

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService, // Inject ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request); // Extract token

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify the token manually
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'), // Use secret from config
      });

      // Attach the payload (which contains user info) to the request object
      // This mimics Passport's behavior of adding user info to req.user
      request['user'] = payload;
    } catch (error) {
      console.error('JWT Validation Error:', error.message); // Log error for debugging
      throw new UnauthorizedException('Invalid or expired token'); // Throw if verification fails
    }

    return true; // If we reach here, the token was valid and user info is attached
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // Standard practice: Token is in the "Authorization: Bearer TOKEN" header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
