<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { ImageCropper, type ImageCropperResult } from '@web/ui/components/ui/image-cropper';

export type ProductCoverCropResult = ImageCropperResult;

const props = withDefaults(
  defineProps<{
    previewSize?: number;
    src?: string;
  }>(),
  {
    previewSize: 320,
  },
);

const emit = defineEmits<{
  reject: [];
  resolve: [result: ProductCoverCropResult];
}>();

const open = defineModel<boolean>('open', { default: false });
const cropper = ref<{
  exportImage: () => Promise<ImageCropperResult>;
  reset: () => void;
}>();
const controlWidth = 44;

async function confirm() {
  if (!cropper.value || !props.src) {
    return;
  }

  emit('resolve', await cropper.value.exportImage());
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto" @interact-outside.prevent>
      <DialogHeader>
        <DialogTitle>裁剪封面</DialogTitle>
        <DialogDescription>调整图片位置和缩放，确认后作为商品封面。</DialogDescription>
      </DialogHeader>

      <div class="mx-auto" :style="{ width: `${previewSize + controlWidth}px` }">
        <ImageCropper
          v-if="src"
          ref="cropper"
          :src="src"
          :preview-size="previewSize"
          :output-size="256"
        />
      </div>

      <DialogFooter class="grid grid-cols-2">
        <Button variant="outline" type="button" @click="emit('reject')">取消</Button>
        <Button type="button" @click="confirm">确认裁剪</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
