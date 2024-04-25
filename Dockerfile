
# 第二阶段
FROM node:20.12.1 AS runtime-stage
#2、作者
MAINTAINER bobovinch
# 创建工作目录
RUN mkdir -p /app
WORKDIR /app

# 复制构建阶段生成的输出到运行时阶段
COPY  ./dist /app/dist
COPY  ./dist /app/dist
#COPY  ./node_modules /app/node_modules
COPY ./package.json /app/
COPY ./.env.* /app/
RUN npm install --force

# 设置环境变量
ENV NODE_ENV=production
ENV CONFIG_COMFYUI_QUENE_REDIS_HOST=172.17.0.4
ENV CONFIG_COMFYUI_QUENE_REDIS_PORT=6379
ENV CONFIG_COMFYUI_SERVER_URL=http://127.0.0.1:8188


# 暴露端口
EXPOSE 3001
EXPOSE 3002

# 设置入口点为启动脚本
ENTRYPOINT ["npm", "run", "start:prod"]

