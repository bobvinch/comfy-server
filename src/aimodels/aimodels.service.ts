import { Injectable } from '@nestjs/common';
import { CreateAimodelDto } from './dto/create-aimodel.dto';
import { UpdateAimodelDto } from './dto/update-aimodel.dto';
import { AIModels } from 'src/schemas/AIMdels.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AimodelsService {
  constructor(
    @InjectModel(AIModels.name) private readonly aimodels: Model<AIModels>,
  ) {}
  create(createAimodelDto: CreateAimodelDto) {
    createAimodelDto.save();
    return 'This action adds a new aimodel';
  }

  findAll() {
    return this.aimodels.find();
    // return '121212';
  }
  findEnable() {
    return this.aimodels.find().where({ isenable: false }).exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} aimodel`;
  }

  update(id: number, updateAimodelDto: UpdateAimodelDto) {
    return `This action updates a #${id} aimodel`;
  }

  remove(id: number) {
    return `This action removes a #${id} aimodel`;
  }
}
