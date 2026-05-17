<script setup lang="ts">
import {
  ProductDeliveryType,
  ProductStatus,
  type CreateProductBody,
  type UpdateProductBody,
} from '@internal/shared/product';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { ImageCropper, type ImageCropperResult } from '@web/ui/components/ui/image-cropper';
import { Loader2 } from 'lucide-vue-next';

import { pointTypeListQuery } from '../../point/queries';
import { useCreateProduct, useUpdateProduct } from '../mutations';
import type { Product } from './ProductListView.vue';

const props = defineProps<{
  product?: Product;
}>();

const open = defineModel<boolean>('open', { default: false });

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: createProduct, isLoading: isCreating } = useCreateProduct();
const { mutateAsync: updateProduct, isLoading: isUpdating } = useUpdateProduct();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
const isEditing = computed(() => Boolean(props.product));
const isLoading = computed(() => isCreating.value || isUpdating.value);
const cropper = ref<{
  exportImage: () => Promise<ImageCropperResult>;
  reset: () => void;
}>();
const selectedCoverFile = ref<File>();
const selectedCoverUrl = ref<string>();
const coverInputKey = ref(0);
const currentCoverUrl = computed(() =>
  props.product?.cover ? `/images/${props.product.cover}` : undefined,
);

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function createDefaultValues(product?: Product): CreateProductBody {
  return {
    name: product?.name ?? '',
    description: product?.description ?? undefined,
    cover: undefined,
    detail: product?.detail ?? undefined,
    pointTypeId: product?.pointTypeId ?? activePointTypes.value[0]?.id ?? '',
    price: product?.price ?? 1,
    status: product?.status ?? ProductStatus.Disabled,
    stock: product?.stock ?? 0,
    deliveryType: product?.deliveryType ?? ProductDeliveryType.Manual,
    sort: product?.sort ?? 0,
  };
}

function revokeSelectedCoverUrl() {
  if (selectedCoverUrl.value) {
    URL.revokeObjectURL(selectedCoverUrl.value);
    selectedCoverUrl.value = undefined;
  }
}

function resetSelectedCover() {
  revokeSelectedCoverUrl();
  selectedCoverFile.value = undefined;
  coverInputKey.value += 1;
}

function createCroppedCoverFile(result: ImageCropperResult) {
  const originalName = selectedCoverFile.value?.name.replace(/\.[^.]+$/, '') || 'product-cover';

  return new File([result.blob], `${originalName}.png`, {
    type: result.blob.type || 'image/png',
  });
}

function handleCoverChange(
  field: { handleChange: (value: File | undefined) => void },
  event: Event,
) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  resetSelectedCover();
  selectedCoverFile.value = file;
  field.handleChange(file);

  if (file) {
    selectedCoverUrl.value = URL.createObjectURL(file);
  }
}

function toProductDeliveryType(value: unknown) {
  return value === ProductDeliveryType.Automatic
    ? ProductDeliveryType.Automatic
    : ProductDeliveryType.Manual;
}

function toProductStatus(value: unknown) {
  return value === ProductStatus.Active ? ProductStatus.Active : ProductStatus.Disabled;
}

const form = useForm({
  defaultValues: createDefaultValues(props.product),
  async onSubmit({ value }: { value: CreateProductBody }) {
    const body = { ...value };

    if (selectedCoverUrl.value && cropper.value) {
      body.cover = createCroppedCoverFile(await cropper.value.exportImage());
    }

    if (props.product) {
      await updateProduct({
        productId: props.product.id,
        body: body satisfies UpdateProductBody,
      });
    } else {
      await createProduct(body);
    }

    form.reset(createDefaultValues(props.product));
    resetSelectedCover();
    open.value = false;
  },
});

watch(
  () => props.product,
  product => {
    form.reset(createDefaultValues(product));
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues(props.product));
    resetSelectedCover();
  }
});

onBeforeUnmount(() => {
  revokeSelectedCoverUrl();
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? '编辑商品' : '添加商品' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '更新商品信息和展示内容。' : '上传并创建一个可兑换商品。' }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="form.handleSubmit">
        <form.Field name="name" #default="{ field }">
          <FieldControl :field="field" label="商品名称" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              placeholder="例如：限定周边"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="pointTypeId" #default="{ field }">
          <FieldControl :field="field" label="积分类型" v-slot="{ id, invalid }">
            <NativeSelect
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(String($event))"
            >
              <NativeSelectOption value="" disabled>选择积分类型</NativeSelectOption>
              <NativeSelectOption
                v-for="pointType in activePointTypes"
                :key="pointType.id"
                :value="pointType.id"
              >
                {{ pointType.name }}
              </NativeSelectOption>
            </NativeSelect>
          </FieldControl>
        </form.Field>

        <form.Field name="price" #default="{ field }">
          <FieldControl :field="field" label="兑换价格" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              type="number"
              min="1"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="stock" #default="{ field }">
          <FieldControl :field="field" label="初始库存" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value ?? 0"
              :aria-invalid="invalid"
              type="number"
              min="0"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="deliveryType" #default="{ field }">
          <FieldControl :field="field" label="发货方式" v-slot="{ id, invalid }">
            <NativeSelect
              :id="id"
              :model-value="field.state.value ?? ProductDeliveryType.Manual"
              :aria-invalid="invalid"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(toProductDeliveryType($event))"
            >
              <NativeSelectOption :value="ProductDeliveryType.Manual">人工发货</NativeSelectOption>
              <NativeSelectOption :value="ProductDeliveryType.Automatic">
                自动发货
              </NativeSelectOption>
            </NativeSelect>
          </FieldControl>
        </form.Field>

        <form.Field name="status" #default="{ field }">
          <FieldControl :field="field" label="商品状态" v-slot="{ id, invalid }">
            <NativeSelect
              :id="id"
              :model-value="field.state.value ?? ProductStatus.Disabled"
              :aria-invalid="invalid"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(toProductStatus($event))"
            >
              <NativeSelectOption :value="ProductStatus.Active">上架</NativeSelectOption>
              <NativeSelectOption :value="ProductStatus.Disabled">下架</NativeSelectOption>
            </NativeSelect>
          </FieldControl>
        </form.Field>

        <form.Field name="sort" #default="{ field }">
          <FieldControl :field="field" label="排序" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value ?? 0"
              :aria-invalid="invalid"
              type="number"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="cover" #default="{ field }">
          <FieldControl
            :field="field"
            label="封面"
            description="支持 JPG、PNG、WebP，选择后可移动和缩放裁剪。"
            v-slot="{ id, invalid }"
          >
            <Input
              :key="coverInputKey"
              :id="id"
              :aria-invalid="invalid"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @blur="field.handleBlur"
              @change="handleCoverChange(field, $event)"
            />
          </FieldControl>
        </form.Field>

        <div class="grid gap-2 sm:col-span-2">
          <ImageCropper
            v-if="selectedCoverUrl"
            ref="cropper"
            :src="selectedCoverUrl"
            :preview-size="320"
            :output-size="512"
          />
          <div
            v-else-if="currentCoverUrl"
            class="bg-muted h-32 w-32 overflow-hidden rounded-md border"
          >
            <img class="h-full w-full object-cover" :src="currentCoverUrl" alt="" />
          </div>
        </div>

        <form.Field name="description" #default="{ field }">
          <FieldControl class="sm:col-span-2" :field="field" label="描述" v-slot="{ id, invalid }">
            <Textarea
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="detail" #default="{ field }">
          <FieldControl class="sm:col-span-2" :field="field" label="详情" v-slot="{ id, invalid }">
            <Textarea
              :id="id"
              :model-value="field.state.value ?? ''"
              :aria-invalid="invalid"
              placeholder="可选，支持 Markdown / HTML / 富文本 JSON"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />
          </FieldControl>
        </form.Field>

        <DialogFooter class="sm:col-span-2">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading || activePointTypes.length === 0">
            <Loader2 v-if="isLoading" class="animate-spin" />
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
