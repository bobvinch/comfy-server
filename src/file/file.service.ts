import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OSS = require('ali-oss');
// const fs = require('fs');
@Injectable()
export class FileService {
  constructor(
    private readonly configService: ConfigService,
  ) {
  }
  /**
   * 将url转换成file
   * @param url 图片链接
   * @param fileName 文件名
   * @param mimeType 文件类型
   * @private
   */
  async urlToFile(url, fileName, mimeType): Promise<File> {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        return new File([buffer], fileName, { type: mimeType });
      });
  }

  /**
   * 将url转换成ArrayBuffer
   *
   * @param url
   */
  async urlToArrayBuffer(url: string): Promise<ArrayBuffer> {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        return buffer;
      });
  }
  /**
   * 上传文件到OSS,返回上传成功的文件名
   *
   * @param file
   * @param type
   */
  async uploadFileToOSS(
    file: string,
    type?: 'image' | 'audio' | 'video',
  ): Promise<string> {
    // 创建OSS客户端实例
    const client = new OSS({
      region: this.configService.get('OSS_REGION'), // 替换为你的OSS区域
      accessKeyId: this.configService.get('OSS_ACCESSKEYID'), // 替换为你的AccessKeyId
      accessKeySecret: this.configService.get('OSS_ACCESSKEYSECRET'), // 替换为你的AccessKeySecret
      bucket: this.configService.get('OSS_BUCKET'), // 替换为你的Bucket名称
    });
    let _f = '';
    let _r = '';
    const filename = nanoid(15);
    // 根据文件类型转换成对应的文件
    switch (type) {
      case 'image':
        _f = filename + '.png';
        _r = 'aidraw/image/temps/';
        break;
      case 'audio':
        _f = filename + '.wav';
        _r = 'aidraw/audio/temps/';
        break;
      case 'video':
        _f = filename + '.mp4';
        _r = 'aidraw/video/temps/';
        break;
      default:
        _f = filename + '.png';
        _r = 'aidraw/others/temps/';
        break;
    }
    //将文件保存到服务器
    const targetPath = `${_r}${_f}`;

    try {
      const _f = await this.urlToArrayBuffer(file);
      //ArrayBuffer转换成Buffer
      const buffer = Buffer.from(_f);
      const { url } = await client.put(targetPath, buffer);
      return url;
    } catch (e) {
      console.error('Error uploading file to OSS:', e);
      throw e;
    }
  }
  //将Buffer上传到OSS
  async uploadBufferToOSS(
    buffer: Buffer,
    type?: 'image' | 'audio' | 'video',
  ): Promise<string> {
    // 创建OSS客户端实例
    const client = new OSS({
      region: this.configService.get('OSS_REGION'), // 替换为你的OSS区域
      accessKeyId: this.configService.get('OSS_ACCESSKEYID'), // 替换为你的AccessKeyId
      accessKeySecret: this.configService.get('OSS_ACCESSKEYSECRET'), // 替换为你的AccessKeySecret
      bucket: this.configService.get('OSS_BUCKET'), // 替换为你的Bucket名称
    });
    let _f = '';
    let _r = '';
    const filename = nanoid(15);
    // 根据文件类型转换成对应的文件
    switch (type) {
      case 'image':
        _f = filename + '.png';
        _r = 'aidraw/image/temps/';
        break;
      case 'audio':
        _f = filename + '.wav';
        _r = 'aidraw/audio/temps/';
        break;
      case 'video':
        _f = filename + '.mp4';
        _r = 'aidraw/video/temps/';
        break;
      default:
        _f = filename + '.png';
        _r = 'aidraw/others/temps/';
        break;
    }
    //将文件保存到服务器
    const targetPath = `${_r}${_f}`;
    try {
      const { url } = await client.put(targetPath, buffer);
      return url;
    } catch (e) {
      console.error('Error uploading file to OSS:', e);
      throw e;
    }
  }
}
