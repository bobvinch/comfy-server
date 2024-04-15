export const FaceSwap = {
  '63': {
    inputs: {
      enabled: true,
      swap_model: 'inswapper_128.onnx',
      facedetection: 'retinaface_resnet50',
      face_restore_model: 'GFPGANv1.4.pth',
      face_restore_visibility: 1,
      codeformer_weight: 0.5,
      detect_gender_input: 'no',
      detect_gender_source: 'no',
      input_faces_index: '0',
      source_faces_index: '0',
      console_log_level: 1,
      input_image: ['91', 0],
      source_image: ['92', 0],
    },
    class_type: 'ReActorFaceSwap',
    _meta: {
      title: 'ReActor换脸',
    },
  },
  '91': {
    inputs: {
      image_path:
        'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/t2i_1.jpg',
      RGBA: 'false',
      filename_text_extension: 'true',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '92': {
    inputs: {
      image_path:
        'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/R-C.jpg',
      RGBA: 'false',
      filename_text_extension: 'true',
    },
    class_type: 'Image Load',
    _meta: {
      title: '图像加载',
    },
  },
  '93': {
    inputs: {
      output_path: '[time(%Y-%m-%d)]',
      filename_prefix: 'aistudio_output_final_',
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
    },
    class_type: 'Image Save',
    _meta: {
      title: '图像保存',
    },
  },
  '94': {
    inputs: {
      output_path: '[time(%Y-%m-%d)]',
      filename_prefix: 'aistudio_output_2_',
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
    },
    class_type: 'Image Save',
    _meta: {
      title: '图像保存',
    },
  },
  '95': {
    inputs: {
      output_path: '[time(%Y-%m-%d)]',
      filename_prefix: 'faceswap_output_final_',
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
      images: ['63', 0],
    },
    class_type: 'Image Save',
    _meta: {
      title: '图像保存',
    },
  },
};
