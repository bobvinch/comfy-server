// import Axios library
import axios from 'axios';

// Set default validation status for Axios
axios.defaults.validateStatus = function (status) {
  // Return true if status is between 200 and 300 inclusive
  return status >= 200 && status < 300;
};

const baseutl = 'https://apps.gptpro.ink/websocket';
const comfyui = axios.create({
  // baseURL: "/sdApi",
  baseURL: baseutl,
  timeout: 100000,
  headers: {
    'Access-Control-Allow-Origin': '*',
    Accept: '*/*',
  },
});

// 添加请求拦截器
comfyui.interceptors.request.use();

// 添加响应拦截器
comfyui.interceptors.response.use();

//getmodels

//COMFYUI
//txt2img

export const uploadImage = (data: any) => {
  return comfyui.post('/upload/image', data);
};

export const getObject_info = () => {
  return comfyui.get('/object_info');
};
//发送任务
export const sendTackprompt = (data: any) => {
  return comfyui.post('/prompt', data);
};
// 获取任务history/{prompt_id}
export const getHistory = (prompt_id: string) => {
  return comfyui.get('/history/' + prompt_id);
};
//在线预览图片
export const getView = (filename: string) => {
  return baseutl + '/view?filename=' + filename + '&type=output';
};
