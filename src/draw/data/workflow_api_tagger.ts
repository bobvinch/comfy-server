export const workflowApiTagger = {
  '10': {
    inputs: {
      image_path: './ComfyUI/input/example.png',
      RGBA: 'false',
      filename_text_extension: 'true',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '11': {
    inputs: {
      model: 'wd-v1-4-moat-tagger-v2',
      threshold: 0.35,
      character_threshold: 0.85,
      replace_underscore: false,
      trailing_comma: false,
      exclude_tags: '',
      tags: 'simple_background, monochrome, comic, greyscale, no_humans, black_background, negative_space',
      image: ['10', 0],
    },
    class_type: 'WD14Tagger|pysssss',
    _meta: {
      title: 'WD14反推提示词',
    },
  },
  '14': {
    inputs: {
      text: ['11', 0],
      label: 'Text Output',
    },
    class_type: 'Text to Console',
    _meta: {
      title: '输出文本到控制台',
    },
  },
};
