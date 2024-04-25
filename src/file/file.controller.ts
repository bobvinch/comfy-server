import { Controller, Get } from '@nestjs/common';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}
  @Get('test')
  async upload() {
    const testurl= "https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/%E6%9D%8E%E4%BA%91%E6%80%9D1130-01.mp4";
    // const testurl= "https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/audio/temps/tts_undefined_%0A%0A%E4%B8%8D%E8%A6%81%E5%BF%98%E8%AE%B0%EF%BC%8C%E9%A3%8E%E9%9B%A8%E8%BF%87%E5%90%8E%EF%BC%8C%E5%BD%A9%E8%99%B9%E4%BC%9A%E5%8D%87%E8%B5%B7.wav";


    const _file = await this.fileService.urlToFile(
      testurl,
      'test.wav',
      'audio/wav',
    );
    return await this.fileService.uploadFileToOSS(testurl);
  }
}
