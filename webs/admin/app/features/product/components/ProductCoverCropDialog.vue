<script setup lang="ts">
import { Button } from '@web/ui/components/ui/button';
import { ImageCropper, type ImageCropperResult } from '@web/ui/components/ui/image-cropper';
import { ImagePlus, Upload, X } from 'lucide-vue-next';

export type ProductCoverCropResult = {
  file: File;
  previewUrl: string;
};

const props = withDefaults(
  defineProps<{
    'aria-invalid'?: boolean;
    currentCoverUrl?: string;
    name?: string;
    previewSize?: number;
  }>(),
  {
    previewSize: 320,
  },
);

const emit = defineEmits<{
  blur: [event: FocusEvent];
  reject: [];
  resolve: [result: ProductCoverCropResult];
}>();

const open = defineModel<boolean>('open', { default: false });
const file = defineModel<File | undefined>();
const inputKey = ref(0);
const cropper = ref<{
  exportImage: () => Promise<ImageCropperResult>;
  reset: () => void;
}>();
const controlWidth = 44;
const sourceUrl = ref<string>();
const previewUrl = ref<string>();
const isDragging = ref(false);

defineExpose({
  previewUrl: readonly(previewUrl),
  reset,
});

function revokePreviewUrl() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = undefined;
  }
}

function revokeSourceUrl() {
  if (sourceUrl.value) {
    URL.revokeObjectURL(sourceUrl.value);
    sourceUrl.value = undefined;
  }
}

function createCroppedCoverFile(result: ImageCropperResult) {
  const originalName = file.value?.name.replace(/\.[^.]+$/, '') || 'product-cover';

  return new File([result.blob], `${originalName}.png`, {
    type: result.blob.type || 'image/png',
  });
}

function reset() {
  revokePreviewUrl();
  file.value = undefined;
  inputKey.value += 1;
  isDragging.value = false;
  open.value = false;
}

function setFile(selectedFile: File | undefined) {
  inputKey.value += 1;

  if (!selectedFile || !selectedFile.type.startsWith('image/')) {
    return;
  }

  file.value = selectedFile;
  open.value = true;
}

function handleChange(event: Event) {
  const input = event.target as HTMLInputElement;

  setFile(input.files?.[0]);
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  setFile(event.dataTransfer?.files[0]);
}

async function confirm() {
  if (!cropper.value || !sourceUrl.value) {
    return;
  }

  const result = await cropper.value.exportImage();
  const croppedFile = createCroppedCoverFile(result);
  const nextPreviewUrl = URL.createObjectURL(result.blob);

  revokePreviewUrl();
  previewUrl.value = nextPreviewUrl;
  file.value = croppedFile;
  emit('resolve', {
    file: croppedFile,
    previewUrl: nextPreviewUrl,
  });
  open.value = false;
}

watch(
  file,
  value => {
    revokeSourceUrl();

    if (value) {
      sourceUrl.value = URL.createObjectURL(value);
    }
  },
  { immediate: true },
);

watch(open, isOpen => {
  if (!isOpen) {
    revokeSourceUrl();
  }
});

onBeforeUnmount(() => {
  revokePreviewUrl();
  revokeSourceUrl();
});
</script>

<template>
  <label
    class="group hover:border-primary hover:bg-accent/50 flex min-h-36 cursor-pointer items-center gap-4 rounded-md border border-dashed p-4 transition-colors"
    :class="[
      props['aria-invalid'] ? 'border-destructive' : undefined,
      isDragging ? 'border-primary bg-accent/60' : undefined,
    ]"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input
      :key="inputKey"
      class="sr-only"
      :aria-invalid="props['aria-invalid']"
      :name="props.name"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @blur="emit('blur', $event)"
      @change="handleChange"
    />
    <div class="bg-muted h-24 w-24 shrink-0 overflow-hidden rounded-md border">
      <img
        v-if="previewUrl || currentCoverUrl"
        class="h-full w-full object-cover"
        :src="previewUrl || currentCoverUrl"
        alt=""
      />
      <div v-else class="text-muted-foreground flex h-full w-full items-center justify-center">
        <ImagePlus class="h-8 w-8" />
      </div>
    </div>
    <div class="grid gap-1">
      <div class="flex items-center gap-2 text-sm font-medium">
        <Upload class="h-4 w-4" />
        点击选择或拖拽图片
      </div>
      <p class="text-muted-foreground text-sm">支持 JPG、PNG、WebP，选择后进行裁剪。</p>
      <Button
        v-if="previewUrl"
        class="mt-2 w-fit"
        size="sm"
        variant="outline"
        type="button"
        @click.prevent="reset"
      >
        <X />
        移除新封面
      </Button>
    </div>

    <Dialog v-model:open="open">
      <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto" @interact-outside.prevent>
        <DialogHeader>
          <DialogTitle>裁剪封面</DialogTitle>
          <DialogDescription>调整图片位置和缩放，确认后作为商品封面。</DialogDescription>
        </DialogHeader>

        <div class="mx-auto" :style="{ width: `${previewSize + controlWidth}px` }">
          <ImageCropper
            v-if="sourceUrl"
            ref="cropper"
            :src="sourceUrl"
            :preview-size="previewSize"
            :output-size="512"
          />
        </div>

        <DialogFooter class="grid grid-cols-2">
          <Button variant="outline" type="button" @click="emit('reject')">取消</Button>
          <Button type="button" @click="confirm">确认裁剪</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </label>
</template>
