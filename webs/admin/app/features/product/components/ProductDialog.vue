<script setup lang="ts">
import {
  ProductDeliveryType,
  ProductStatus,
  type CreateProductBody,
  type UpdateProductBody,
} from '@internal/shared/product';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { useOverlay } from '@web/ui/components/ui/overlay';
import { ImagePlus, Loader2, Upload, X } from 'lucide-vue-next';

import { optionalText } from '~/utils/form';

import { pointTypeListQuery } from '../../point/queries';
import { useCreateProduct, useUpdateProduct } from '../mutations';
import ProductCoverCropDialog, { type ProductCoverCropResult } from './ProductCoverCropDialog.vue';
import type { Product } from './ProductListView.vue';

const props = defineProps<{
  product?: Product;
}>();

type ProductPayload = Omit<
  CreateProductBody,
  'allowCancel' | 'metadata' | 'price' | 'sort' | 'stock'
> & {
  allowCancel?: string;
  metadata?: string;
  price: string;
  sort?: string;
  stock?: string;
};

const open = defineModel<boolean>('open', { default: false });

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: createProduct, isLoading: isCreating } = useCreateProduct();
const { mutateAsync: updateProduct, isLoading: isUpdating } = useUpdateProduct();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
const isEditing = computed(() => Boolean(props.product));
const isLoading = computed(() => isCreating.value || isUpdating.value);
const pendingCoverFile = ref<File>();
const pendingCoverUrl = ref<string>();
const croppedCoverFile = ref<File>();
const croppedCoverUrl = ref<string>();
const isDraggingCover = ref(false);
const coverInputKey = ref(0);
const coverCropPreviewSize = 320;
const [openProductCoverCropDialog, , dismissProductCoverCropDialog] =
  useOverlay(ProductCoverCropDialog);
const {
  public: { apiBaseUrl },
} = useRuntimeConfig();
const imageBaseUrl = computed(() => apiBaseUrl.replace(/\/$/, ''));
const currentCoverUrl = computed(() => getImageUrl(props.product?.cover));

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
    allowCancel: false,
    sort: product?.sort ?? 0,
  };
}

function revokeSelectedCoverUrl() {
  if (pendingCoverUrl.value) {
    URL.revokeObjectURL(pendingCoverUrl.value);
    pendingCoverUrl.value = undefined;
  }

  if (croppedCoverUrl.value) {
    URL.revokeObjectURL(croppedCoverUrl.value);
    croppedCoverUrl.value = undefined;
  }
}

function resetSelectedCover() {
  revokeSelectedCoverUrl();
  pendingCoverFile.value = undefined;
  croppedCoverFile.value = undefined;
  coverInputKey.value += 1;
  dismissProductCoverCropDialog();
  isDraggingCover.value = false;
}

function resetPendingCover() {
  if (pendingCoverUrl.value) {
    URL.revokeObjectURL(pendingCoverUrl.value);
    pendingCoverUrl.value = undefined;
  }

  pendingCoverFile.value = undefined;
}

function createCroppedCoverFile(result: ProductCoverCropResult) {
  const originalName = pendingCoverFile.value?.name.replace(/\.[^.]+$/, '') || 'product-cover';

  return new File([result.blob], `${originalName}.png`, {
    type: result.blob.type || 'image/png',
  });
}

function getImageUrl(cover: Product['cover'] | undefined) {
  if (!cover) {
    return undefined;
  }

  if (/^https?:\/\//.test(cover)) {
    return cover;
  }

  const imagePath = cover.startsWith('/images/') ? cover : `/images/${cover.replace(/^\/+/, '')}`;

  return `${imageBaseUrl.value}${imagePath}`;
}

async function setPendingCoverFile(file: File | undefined) {
  resetPendingCover();
  coverInputKey.value += 1;

  if (!file || !file.type.startsWith('image/')) {
    return;
  }

  pendingCoverFile.value = file;
  pendingCoverUrl.value = URL.createObjectURL(file);

  try {
    const result = await openProductCoverCropDialog({
      previewSize: coverCropPreviewSize,
      src: pendingCoverUrl.value,
    });

    if (result) {
      confirmCoverCrop(result);
    } else {
      resetPendingCover();
    }
  } catch {
    resetPendingCover();
  }
}

function handleCoverChange(event: Event) {
  const input = event.target as HTMLInputElement;

  void setPendingCoverFile(input.files?.[0]);
}

function handleCoverDrop(event: DragEvent) {
  isDraggingCover.value = false;
  void setPendingCoverFile(event.dataTransfer?.files[0]);
}

function confirmCoverCrop(result: ProductCoverCropResult) {
  if (croppedCoverUrl.value) {
    URL.revokeObjectURL(croppedCoverUrl.value);
  }

  croppedCoverFile.value = createCroppedCoverFile(result);
  croppedCoverUrl.value = URL.createObjectURL(result.blob);
  resetPendingCover();
}

function toProductDeliveryType(value: unknown) {
  return value === ProductDeliveryType.Automatic
    ? ProductDeliveryType.Automatic
    : ProductDeliveryType.Manual;
}

function toProductStatus(value: unknown) {
  return value === ProductStatus.Active ? ProductStatus.Active : ProductStatus.Disabled;
}

function toBooleanSelectValue(value: unknown) {
  return value === 'true';
}

function omitUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>;
}

function toProductPayload(value: CreateProductBody, options: { omitUndefined?: boolean } = {}) {
  const { allowCancel, metadata, ...product } = value;
  const payload = {
    ...product,
    allowCancel: allowCancel === undefined ? undefined : String(allowCancel),
    metadata: metadata === undefined ? undefined : JSON.stringify(metadata),
    price: String(value.price),
    sort: value.sort === undefined ? undefined : String(value.sort),
    stock: value.stock === undefined ? undefined : String(value.stock),
  } as ProductPayload;

  return options.omitUndefined === false ? payload : (omitUndefined(payload) as ProductPayload);
}

const form = useForm({
  defaultValues: createDefaultValues(props.product),
  async onSubmit({ value }: { value: CreateProductBody }) {
    const body = toProductPayload(value, { omitUndefined: !props.product });

    if (croppedCoverFile.value) {
      body.cover = croppedCoverFile.value;
    }

    if (props.product) {
      await updateProduct({
        productId: props.product.id,
        body: body as unknown as UpdateProductBody,
      });
    } else {
      await createProduct(body as unknown as CreateProductBody);
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
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? '编辑商品' : '添加商品' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '更新商品信息和展示内容。' : '上传并创建一个可兑换商品。' }}
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="form.handleSubmit">
        <form.Field name="name" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">商品名称</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="例如：限定周边"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="pointTypeId" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">积分类型</FieldLabel>
            <NativeSelect
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
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

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="price" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">兑换价格</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              min="1"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="stock" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">初始库存</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? 0"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              min="0"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="deliveryType" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">发货方式</FieldLabel>
            <NativeSelect
              :id="field.name"
              :model-value="field.state.value ?? ProductDeliveryType.Manual"
              :aria-invalid="field.state.meta.errors.length > 0"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(toProductDeliveryType($event))"
            >
              <NativeSelectOption :value="ProductDeliveryType.Manual">人工发货</NativeSelectOption>
              <NativeSelectOption :value="ProductDeliveryType.Automatic">
                自动发货
              </NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="status" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">商品状态</FieldLabel>
            <NativeSelect
              :id="field.name"
              :model-value="field.state.value ?? ProductStatus.Disabled"
              :aria-invalid="field.state.meta.errors.length > 0"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(toProductStatus($event))"
            >
              <NativeSelectOption :value="ProductStatus.Active">上架</NativeSelectOption>
              <NativeSelectOption :value="ProductStatus.Disabled">下架</NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="allowCancel" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">允许取消订单</FieldLabel>
            <NativeSelect
              :id="field.name"
              :model-value="String(field.state.value ?? false)"
              :aria-invalid="field.state.meta.errors.length > 0"
              @blur="field.handleBlur"
              @update:model-value="field.handleChange(toBooleanSelectValue($event))"
            >
              <NativeSelectOption value="false">不允许</NativeSelectOption>
              <NativeSelectOption value="true">允许</NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="sort" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">排序</FieldLabel>
            <Input
              :id="field.name"
              :model-value="field.state.value ?? 0"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="number"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(Number($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="cover" #default="{ field }">
          <Field
            class="sm:col-span-2 lg:col-span-3"
            :data-invalid="field.state.meta.errors.length > 0"
          >
            <FieldLabel :for="field.name">封面</FieldLabel>
            <label
              :for="field.name"
              class="group hover:border-primary hover:bg-accent/50 flex min-h-36 cursor-pointer items-center gap-4 rounded-md border border-dashed p-4 transition-colors"
              :class="[
                field.state.meta.errors.length > 0 ? 'border-destructive' : undefined,
                isDraggingCover ? 'border-primary bg-accent/60' : undefined,
              ]"
              @dragenter.prevent="isDraggingCover = true"
              @dragover.prevent="isDraggingCover = true"
              @dragleave.prevent="isDraggingCover = false"
              @drop.prevent="handleCoverDrop"
            >
              <input
                :key="coverInputKey"
                :id="field.name"
                class="sr-only"
                :aria-invalid="field.state.meta.errors.length > 0"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                @blur="field.handleBlur"
                @change="handleCoverChange"
              />
              <div class="bg-muted h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                <img
                  v-if="croppedCoverUrl || currentCoverUrl"
                  class="h-full w-full object-cover"
                  :src="croppedCoverUrl || currentCoverUrl"
                  alt=""
                />
                <div
                  v-else
                  class="text-muted-foreground flex h-full w-full items-center justify-center"
                >
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
                  v-if="croppedCoverUrl"
                  class="mt-2 w-fit"
                  size="sm"
                  variant="outline"
                  type="button"
                  @click.prevent="resetSelectedCover"
                >
                  <X />
                  移除新封面
                </Button>
              </div>
            </label>

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="description" #default="{ field }">
          <Field
            class="sm:col-span-2 lg:col-span-3"
            :data-invalid="field.state.meta.errors.length > 0"
          >
            <FieldLabel :for="field.name">描述</FieldLabel>
            <Textarea
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="可选"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="detail" #default="{ field }">
          <Field
            class="sm:col-span-2 lg:col-span-3"
            :data-invalid="field.state.meta.errors.length > 0"
          >
            <FieldLabel :for="field.name">详情</FieldLabel>
            <Textarea
              :id="field.name"
              :model-value="field.state.value ?? ''"
              :aria-invalid="field.state.meta.errors.length > 0"
              placeholder="可选，支持 Markdown / HTML / 富文本 JSON"
              @blur="field.handleBlur"
              @input="field.handleChange(optionalText($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <DialogFooter class="sm:col-span-2 lg:col-span-3">
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
