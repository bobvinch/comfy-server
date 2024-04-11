export const image2img = {
  '18': {
    inputs: {
      text: 'paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, manboobs,(ugly:1.331), (duplicate:1.331), (morbid:1.21), (mutilated:1.21), (tranny:1.331), mutated hands, (poorly drawn hands:1.331), blurry, (bad anatomy:1.21), (bad proportions:1.331), extra limbs, (disfigured:1.331), (more than 2 nipples:1.331), (missing arms:1.331), (extra legs:1.331), (fused fingers:1.61051), (too many fingers:1.61051), (unclear eyes:1.331), bad hands, missing fingers, extra digit, (futa:1.1), bad body, NG_DeepNegative_V1_75T,',
    },
    class_type: 'ttN text',
    _meta: {
      title: 'TTN文本',
    },
  },
  '19': {
    inputs: {
      text: '(8k, best quality, masterpiece:1.2)',
    },
    class_type: 'ttN text',
    _meta: {
      title: 'TTN文本',
    },
  },
  '25': {
    inputs: {
      delimiter: ',',
      clean_whitespace: 'true',
      text_a: ['98', 0],
      text_b: ['19', 0],
    },
    class_type: 'Text Concatenate',
    _meta: {
      title: '文本连锁',
    },
  },
  '26': {
    inputs: {
      delimiter: '',
      clean_whitespace: 'true',
      text_b: ['18', 0],
    },
    class_type: 'Text Concatenate',
    _meta: {
      title: '文本连锁',
    },
  },
  '51': {
    inputs: {
      output_path: '[time(%Y-%m-%d)]',
      filename_prefix: 'img2img_output_final_',
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
      images: ['85', 5],
    },
    class_type: 'Image Save',
    _meta: {
      title: '图像保存',
    },
  },
  '70': {
    inputs: {
      image_path: './ComfyUI/input/example.png',
      RGBA: 'false',
      filename_text_extension: 'false',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '71': {
    inputs: {
      image: ['70', 0],
    },
    class_type: 'Image Size to Number',
    _meta: {
      title: '图像尺寸到数字',
    },
  },
  '72': {
    inputs: {
      number_type: 'integer',
      number: 512,
    },
    class_type: 'Constant Number',
    _meta: {
      title: '常数',
    },
  },
  '73': {
    inputs: {
      operation: 'division',
      number_a: ['72', 0],
      number_b: ['71', 0],
    },
    class_type: 'Number Operation',
    _meta: {
      title: '数字运算',
    },
  },
  '74': {
    inputs: {
      upscale_method: 'nearest-exact',
      scale_by: ['73', 1],
      image: ['70', 0],
    },
    class_type: 'ImageScaleBy',
    _meta: {
      title: '图像按系数缩放',
    },
  },
  '85': {
    inputs: {
      seed: 116235324919319,
      steps: 20,
      cfg: 7,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      denoise: 1,
      preview_method: 'none',
      vae_decode: 'true',
      model: ['101', 0],
      positive: ['101', 1],
      negative: ['101', 2],
      latent_image: ['86', 0],
      optional_vae: ['101', 4],
    },
    class_type: 'KSampler (Efficient)',
    _meta: {
      title: 'K采样器(效率)',
    },
  },
  '86': {
    inputs: {
      pixels: ['74', 0],
      vae: ['101', 4],
    },
    class_type: 'VAEEncode',
    _meta: {
      title: 'VAE编码',
    },
  },
  '89': {
    inputs: {
      image: 'ComfyUI_00001_.png',
      upload: 'image',
    },
    class_type: 'LoadImage',
    _meta: {
      title: '加载图像',
    },
  },
  '98': {
    inputs: {
      model: 'wd-v1-4-moat-tagger-v2',
      threshold: 0.35,
      character_threshold: 0.85,
      replace_underscore: false,
      trailing_comma: false,
      exclude_tags: '',
      tags: 'flower, outdoors, sky, cloud, water, no_humans, night, star_\\(sky\\), night_sky, scenery, starry_sky, reflection, sunset, mountain, horizon, landscape, mountainous_horizon',
      image: ['70', 0],
    },
    class_type: 'WD14Tagger|pysssss',
    _meta: {
      title: 'WD14反推提示词',
    },
  },
  '101': {
    inputs: {
      ckpt_name: 'anything-v5-PrtRE.safetensors',
      vae_name: 'Baked VAE',
      clip_skip: -1,
      lora_name: 'None',
      lora_model_strength: 1,
      lora_clip_strength: 1,
      positive: ['25', 0],
      negative: ['26', 0],
      token_normalization: 'none',
      weight_interpretation: 'A1111',
      empty_latent_width: 512,
      empty_latent_height: 512,
      batch_size: 1,
    },
    class_type: 'Efficient Loader',
    _meta: {
      title: '效率加载器',
    },
  },
};
