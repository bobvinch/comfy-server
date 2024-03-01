import { PartialType } from '@nestjs/swagger';
import { CreateAimodelDto } from './create-aimodel.dto';

export class UpdateAimodelDto extends PartialType(CreateAimodelDto) {}
