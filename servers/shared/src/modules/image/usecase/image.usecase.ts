import { createHash } from 'node:crypto';
import { mkdir, access, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { InvalidImageSizeError } from '../domain';

export class ImageUseCase {
  constructor(readonly imageSavePath: string) {}

  private async ensureImageDir() {
    await mkdir(this.imageSavePath, { recursive: true });
  }

  private async exists(filePath: string) {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async save(file?: File) {
    if (!file) {
      return;
    }

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
    const filePath = path.join(this.imageSavePath, filename);

    // 避免重复上传
    if (!(await this.exists(filePath))) {
      await writeFile(filePath, outputBuffer);
    }

    return filename;
  }
}
