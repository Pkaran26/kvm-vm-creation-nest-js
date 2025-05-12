import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateSSHKeyDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  privateKey: number;

  @IsNotEmpty()
  @IsString()
  publicKey: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}

export interface SSHKeyResponse {
  status: boolean;
  privateKey: string;
  publicKey: string;
}
