export const matting = {
  '5': {
    inputs: {
      prompt: ['67', 0],
      threshold: 0.3,
      sam_model: ['6', 0],
      grounding_dino_model: ['7', 0],
      image: ['62', 0],
    },
    class_type: 'GroundingDinoSAMSegment (segment anything)',
    _meta: {
      title: 'G-DinoSAM语义分割',
    },
  },
  '6': {
    inputs: {
      model_name: 'sam_vit_h_4b8939.pth',
      device_mode: 'Prefer GPU',
    },
    class_type: 'SAMLoader',
    _meta: {
      title: 'SAM加载器',
    },
  },
  '7': {
    inputs: {
      model_name: 'GroundingDINO_SwinB (938MB)',
    },
    class_type: 'GroundingDinoModelLoader (segment anything)',
    _meta: {
      title: 'G-Dino模型加载器',
    },
  },
  '44': {
    inputs: {
      mask: ['5', 1],
    },
    class_type: 'InvertMask',
    _meta: {
      title: '遮罩反转',
    },
  },
  '59': {
    inputs: {
      image: ['5', 0],
      alpha: ['44', 0],
    },
    class_type: 'JoinImageWithAlpha',
    _meta: {
      title: '合并图像Alpha',
    },
  },
  '62': {
    inputs: {
      image_path:
        'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/4c226c64d37f410c857f98ebb3ecb5ef.jpeg',
      RGBA: 'false',
      filename_text_extension: 'false',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '63': {
    inputs: {
      output_path: '[time(%Y-%m-%d)]',
      filename_prefix: ['69', 0],
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
      images: ['59', 0],
    },
    class_type: 'Image Save',
    _meta: {
      title: '图像保存',
    },
  },
  '67': {
    inputs: {
      text: '西瓜',
      platform: 'alibaba',
      source: 'auto',
      target: 'en',
    },
    class_type: 'ZFTextTranslation',
    _meta: {
      title: '文本翻译',
    },
  },
  '69': {
    inputs: {
      delimiter: '_',
      clean_whitespace: 'true',
      text_a: ['62', 2],
      text_b: ['71', 0],
    },
    class_type: 'Text Concatenate',
    _meta: {
      title: '文本连锁',
    },
  },
  '71': {
    inputs: {
      text: '_segment_output_final_',
    },
    class_type: 'Text Multiline',
    _meta: {
      title: '多行文本',
    },
  },
};
