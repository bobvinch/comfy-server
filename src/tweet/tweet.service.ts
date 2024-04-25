import { Injectable } from '@nestjs/common';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { UpdateTweetDto } from './dto/update-tweet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tweet, TweetProject } from './entities/tweet.schema';

@Injectable()
export class TweetService {
  constructor(@InjectModel(Tweet.name) private tweetModel: Model<Tweet>) {}
  create(createTweetDto: CreateTweetDto) {
    const newTweet = new this.tweetModel(createTweetDto);
    return newTweet.save();
  }

  /**
   * 保存项目
   * @param user_id
   * @param project
   */
  async savePrject(user_id: string, project: TweetProject) {
    //首先看是否有记录存在
    const _tweet = await this.findOne(user_id);
    if (_tweet) {
      //有记录存在，则更新
      //根据项目名称判断，当前项目是否存在
      const _project = _tweet.projects.find(
        (item) => item.projectName === project.projectName,
      );
      if (_project) {
        //存在，则更新
        return this.tweetModel.updateOne(
          { user_id, 'projects.projectName': _project.projectName },
          {
            $set: {
              'projects.$': project,
            },
          },
        );
      } else {
        //如果项目名称不存在，则添加
        return this.tweetModel.updateOne(
          { user_id },
          {
            $push: {
              projects: project,
            },
          },
        );
      }
    }
    return this.tweetModel.create({ user_id, projects: [project] });
  }

  /**
   * 根据user_id获取项目所有的历史项目
   */
  async getData(user_id: string) {
    const _tweet = await this.findOne(user_id);
    if (_tweet) {
      return _tweet;
    }
    return null;
  }

  findAll() {
    return this.tweetModel.find();
  }

  async findOne(id: string) {
    return await this.tweetModel.findOne({ user_id: id }).exec();
  }

  update(id: number, updateTweetDto: UpdateTweetDto) {
    return `This action updates a #${id} tweet`;
  }

  remove(id: number) {
    return `This action removes a #${id} tweet`;
  }
}
