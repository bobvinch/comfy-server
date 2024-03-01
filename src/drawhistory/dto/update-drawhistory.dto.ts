import { PartialType } from '@nestjs/mapped-types';
import { CreateDrawhistoryDto } from './create-drawhistory.dto';

export class UpdateDrawhistoryDto extends PartialType(CreateDrawhistoryDto) {}
