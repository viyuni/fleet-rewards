import { createHash } from 'node:crypto';
import { mkdir, access, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { config } from '../../config';
import { InvalidImageSizeError } from './errors';

export class ImageUseCase {
  async ensureImageDir() {
    await mkdir(config.IMAGE_SAVE_PATH, { recursive: true });
  }

  async upload(file: File) {
    await this.ensureImageDir();

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    const image = sharp(inputBuffer, {
      failOn: 'error',
      // 限制图片大小
      limitInputPixels: 10_000_000,
    });

    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new InvalidImageSizeError();
    }

    const outputBuffer = await image
      .rotate()
      .resize({
        width: 512,
        height: 512,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();

    const hash = createHash('sha256').update(inputBuffer).digest('hex');
    const hashPrefix = hash.slice(0, 32);

    const filename = `${hashPrefix}.webp`;
    const filePath = path.join(config.IMAGE_SAVE_PATH, filename);

    // 避免重复上传
    if (!(await this.exists(filePath))) {
      await writeFile(filePath, outputBuffer);
    }

    return {
      filename,
      size: outputBuffer.byteLength,
      width: metadata.width,
      height: metadata.height,
    };
  }

  private async exists(filePath: string) {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
