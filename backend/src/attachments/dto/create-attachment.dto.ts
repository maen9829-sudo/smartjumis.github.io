import { IsString, IsInt, IsUrl, Min, Max } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  fileName: string;   // original file name shown to users

  @IsString()
  fileUrl: string;    // Supabase Storage public URL (uploaded by client directly)

  @IsInt()
  @Min(1)
  @Max(52_428_800)    // max 50 MB
  fileSize: number;   // bytes

  @IsString()
  mimeType: string;   // 'application/pdf', 'image/png', etc.
}
