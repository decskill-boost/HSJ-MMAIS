import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { SupabaseJwtPayload } from './supabase-jwt-payload.interface';
import type { AuthenticatedRequest } from './authenticated-request.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly client: jwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.client = jwksClient({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000, // 10 minutos
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.verifyToken(token);
      (request as AuthenticatedRequest).user = payload;
    } catch (err) {
      // Não logamos o token nem o payload - apenas a falha em si, para
      // não deixar dados sensíveis em ficheiros de log.
      console.error('[SupabaseAuthGuard] falha ao verificar token', err);
      throw new UnauthorizedException();
    }
    return true;
  }

  private verifyToken(token: string): Promise<SupabaseJwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => {
          if (!header.kid) {
            callback(new Error('Token sem "kid" no header'));
            return;
          }
          this.client.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
              callback(err ?? new Error('Chave de assinatura não encontrada'));
              return;
            }
            callback(null, key.getPublicKey());
          });
        },
        // ES256: chave atual (assimétrica). HS256/RS256: mantidos para
        // cobrir tokens antigos ainda não expirados durante a transição.
        { algorithms: ['ES256', 'RS256', 'HS256'] },
        (err, decoded) => {
          if (err || !decoded || typeof decoded === 'string') {
            reject(err ?? new Error('Token inválido'));
            return;
          }
          resolve(decoded as SupabaseJwtPayload);
        },
      );
    });
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
