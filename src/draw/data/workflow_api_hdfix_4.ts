export const workflowApiHdfix4 = {
  '5': {
    inputs: {
      output_path: '[time(%Y-%m-%d)]',
      filename_prefix: ['16', 0],
      filename_delimiter: '_',
      filename_number_padding: 4,
      filename_number_start: 'false',
      extension: 'png',
      quality: 100,
      lossless_webp: 'false',
      overwrite_mode: 'false',
      show_history: 'false',
      show_history_by_prefix: 'true',
      embed_workflow: 'true',
      show_previews: 'true',
      images: ['11', 0],
    },
    class_type: 'Image Save',
    _meta: {
      title: '图像保存',
    },
  },
  '11': {
    inputs: {
      upscale_model: ['12', 0],
      image: ['15', 0],
    },
    class_type: 'ImageUpscaleWithModel',
    _meta: {
      title: '图像通过模型放大',
    },
  },
  '12': {
    inputs: {
      model_name: '4x-UltraSharp.pth',
    },
    class_type: 'UpscaleModelLoader',
    _meta: {
      title: '放大模型加载器',
    },
  },
  '15': {
    inputs: {
      image_path: 'E:\\ComfyUI-aki-v1.2\\output\\ComfyUI_00001_.png',
      RGBA: 'false',
      filename_text_extension: 'false',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '16': {
    inputs: {
      delimiter: '_',
      clean_whitespace: 'true',
      text_a: ['15', 2],
      text_b: ['18', 0],
    },
    class_type: 'Text Concatenate',
    _meta: {
      title: '文本连锁',
    },
  },
  '18': {
    inputs: {
      Text: 'hdifx_output_final_',
    },
    class_type: 'Text box',
    _meta: {
      title: '文本框',
    },
  },
};
