<script setup lang="ts">
import {
  CreateProductSchema,
  ProductDeliveryType,
  ProductStatus,
  type CreateProductBody,
} from '@internal/shared/product';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { fromDatetimeLocalValue, toDatetimeLocalValue } from '~/utils/form';

import { pointTypeListQuery } from '../../point/queries';
import { useCreateProduct } from '../mutations';
import ProductCoverCropDialog from './ProductCoverCropDialog.vue';

const open = defineModel<boolean>('open', { default: false });

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: createProduct, isLoading } = useCreateProduct();

const activePointTypes = computed(
  () => pointTypes.value?.filter(pointType => pointType.status === 'active') ?? [],
);
const coverFile = ref<File>();
const productCoverCropDialog = ref<InstanceType<typeof ProductCoverCropDialog>>();
const coverCropPreviewSize = 320;
const {
  public: { apiBaseUrl },
} = useRuntimeConfig();
const imageBaseUrl = computed(() => apiBaseUrl.replace(/\/$/, ''));
const currentCoverUrl = computed(() => undefined);

function createDefaultValues(): CreateProductBody {
  return {
    name: '',
    description: undefined,
    cover: undefined,
    detail: undefined,
    pointTypeId: activePointTypes.value[0]?.id ?? '',
    price: 1,
    status: ProductStatus.Disabled,
    stock: 0,
    deliveryType: ProductDeliveryType.Manual,
    startTime: undefined,
    endTime: undefined,
    allowCancel: false,
    sort: 0,
  };
}

function resetSelectedCover() {
  coverFile.value = undefined;
  productCoverCropDialog.value?.reset();
}

function getImageUrl(cover: string | undefined) {
  if (!cover) {
    return undefined;
  }

  if (/^https?:\/\//.test(cover)) {
    return cover;
  }

  const imagePath = cover.startsWith('/images/') ? cover : `/images/${cover.replace(/^\/+/, '')}`;

  return `${imageBaseUrl.value}${imagePath}`;
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

const form = useForm({
  validators: {
    onSubmit: CreateProductSchema,
  },
  defaultValues: createDefaultValues(),
  async onSubmit({ value }: { value: CreateProductBody }) {
    const body = { ...value };

    if (coverFile.value) {
      body.cover = coverFile.value;
    }

    await createProduct(body);

    form.reset(createDefaultValues());
    resetSelectedCover();
    open.value = false;
  },
});

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues());
    resetSelectedCover();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>添加商品</DialogTitle>
        <DialogDescription>上传并创建一个可兑换商品。</DialogDescription>
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

        <form.Field name="startTime" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">开始时间</FieldLabel>
            <Input
              :id="field.name"
              :model-value="toDatetimeLocalValue(field.state.value)"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(fromDatetimeLocalValue($event.target.value))"
            />

            <FieldError :errors="field.state.meta.errors" />
          </Field>
        </form.Field>

        <form.Field name="endTime" #default="{ field }">
          <Field :data-invalid="field.state.meta.errors.length > 0">
            <FieldLabel :for="field.name">结束时间</FieldLabel>
            <Input
              :id="field.name"
              :model-value="toDatetimeLocalValue(field.state.value)"
              :aria-invalid="field.state.meta.errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.handleBlur"
              @input="field.handleChange(fromDatetimeLocalValue($event.target.value))"
            />

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
            <ProductCoverCropDialog
              ref="productCoverCropDialog"
              v-model:file="coverFile"
              :current-cover-url="currentCoverUrl"
              :invalid="field.state.meta.errors.length > 0"
              :preview-size="coverCropPreviewSize"
              @blur="field.handleBlur"
            />

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
              @input="field.handleChange($event.target.value)"
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
              @input="field.handleChange($event.target.value)"
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
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
