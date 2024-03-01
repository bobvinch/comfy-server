import { Injectable } from '@nestjs/common';
import { CreateDrawhistoryDto } from './dto/create-drawhistory.dto';
import { UpdateDrawhistoryDto } from './dto/update-drawhistory.dto';
import { Drawhistory } from 'src/schemas/DrawHistory.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class DrawhistoryService {
  constructor(
    @InjectModel(Drawhistory.name) private drawhistoryModel: Model<Drawhistory>,
  ) {}
  async create(createDrawhistoryDto: CreateDrawhistoryDto) {
    return await this.drawhistoryModel.create(createDrawhistoryDto);
  }

  findAll() {
    return this.drawhistoryModel.find();
  }

  findOne(id: string) {
    return this.drawhistoryModel.findById(id);
  }
  async findOnyByPrompt(prompt_id: string) {
    return await this.drawhistoryModel.findOne({ prompt_id }).exec();
  }
  update(id: string, updateDrawhistoryDto: UpdateDrawhistoryDto) {
    return this.drawhistoryModel.findByIdAndUpdate(id, updateDrawhistoryDto);
  }

  updatePromptstatus(prompt_id: string, updateDrawhistoryDto: any) {
    return this.drawhistoryModel
      .findOneAndUpdate({ prompt_id: prompt_id }, updateDrawhistoryDto)
      .exec();
  }

  remove(id: string) {
    return this.drawhistoryModel.findByIdAndDelete(id);
  }
}
