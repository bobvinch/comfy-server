export const inpainting = {
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
      text_a: ['95', 0],
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
      text_a: ['94', 0],
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
      filename_prefix: ['93', 0],
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
      image_path:
        'C:\\Users\\wangb\\Downloads\\image1 - 2024-03-20T180727.831.png',
      RGBA: 'false',
      filename_text_extension: 'false',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '85': {
    inputs: {
      seed: 205149528245215,
      steps: 20,
      cfg: 7,
      sampler_name: 'dpmpp_2m',
      scheduler: 'karras',
      denoise: 0.5,
      preview_method: 'none',
      vae_decode: 'true',
      model: ['98', 0],
      positive: ['98', 1],
      negative: ['98', 2],
      latent_image: ['88', 0],
      optional_vae: ['98', 4],
    },
    class_type: 'KSampler (Efficient)',
    _meta: {
      title: 'K采样器(效率)',
    },
  },
  '86': {
    inputs: {
      pixels: ['70', 0],
      vae: ['98', 4],
    },
    class_type: 'VAEEncode',
    _meta: {
      title: 'VAE编码',
    },
  },
  '87': {
    inputs: {
      image_path: 'C:\\Users\\wangb\\Downloads\\mask (21).png',
      RGBA: 'false',
      filename_text_extension: 'false',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '88': {
    inputs: {
      samples: ['86', 0],
      mask: ['87', 1],
    },
    class_type: 'SetLatentNoiseMask',
    _meta: {
      title: '设置Latent噪波遮罩',
    },
  },
  '93': {
    inputs: {
      delimiter: '_',
      clean_whitespace: 'true',
      text_a: ['87', 2],
      text_b: ['100', 0],
    },
    class_type: 'Text Concatenate',
    _meta: {
      title: '文本连锁',
    },
  },
  '94': {
    inputs: {
      text: '',
      platform: 'alibaba',
      source: 'auto',
      target: 'en',
    },
    class_type: 'ZFTextTranslation',
    _meta: {
      title: '文本翻译',
    },
  },
  '95': {
    inputs: {
      text: '',
      platform: 'alibaba',
      source: 'auto',
      target: 'en',
    },
    class_type: 'ZFTextTranslation',
    _meta: {
      title: '文本翻译',
    },
  },
  '98': {
    inputs: {
      ckpt_name: 'majicmixRealistic_v7.safetensors',
      vae_name: 'Baked VAE',
      clip_skip: -2,
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
  '100': {
    inputs: {
      text: 'inpaiting_output_final_',
    },
    class_type: 'ttN text',
    _meta: {
      title: 'TTN文本',
    },
  },
};
