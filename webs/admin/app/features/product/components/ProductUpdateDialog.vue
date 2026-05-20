<script setup lang="ts">
import {
  ProductDeliveryType,
  ProductStatus,
  UpdateProductSchema,
  type UpdateProductBody,
} from '@internal/shared/product';
import { toTypedSchema } from '@vee-validate/valibot';
import { Button } from '@web/ui/components/ui/button';
import { FormField } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';
import { useForm } from 'vee-validate';

import { fromDatetimeLocalValue, toDatetimeLocalValue } from '~/utils/form';

import { pointTypeListQuery } from '../../point/queries';
import { useUpdateProduct } from '../mutations';
import ProductCoverCropDialog from './ProductCoverCropDialog.vue';
import type { Product } from './ProductListView.vue';

const props = defineProps<{
  product: Product;
}>();

type ProductUpdateFormValues = UpdateProductBody;

const open = defineModel<boolean>('open', { default: false });

const { data: pointTypes } = useQuery(pointTypeListQuery);
const { mutateAsync: updateProduct, isLoading } = useUpdateProduct();

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
const currentCoverUrl = computed(() => getImageUrl(props.product.cover));

function createDefaultValues(product: Product): ProductUpdateFormValues {
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
    startTime: product?.startTime ? new Date(product.startTime).getTime() : undefined,
    endTime: product?.endTime ? new Date(product.endTime).getTime() : undefined,
    allowCancel: false,
    sort: product?.sort ?? 0,
  };
}

function resetSelectedCover() {
  coverFile.value = undefined;
  productCoverCropDialog.value?.reset();
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

const formSchema = toTypedSchema(UpdateProductSchema);

const { handleSubmit, meta, resetForm } = useForm<ProductUpdateFormValues>({
  validationSchema: formSchema,
  initialValues: createDefaultValues(props.product),
});

const onSubmit = handleSubmit(async values => {
  const body = { ...values };

  if (coverFile.value) {
    body.cover = coverFile.value;
  }

  await updateProduct({
    productId: props.product.id,
    body,
  });

  resetForm({ values: createDefaultValues(props.product) });
  resetSelectedCover();
  open.value = false;
});

watch(
  () => props.product,
  product => {
    resetForm({ values: createDefaultValues(product) });
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    resetForm({ values: createDefaultValues(props.product) });
    resetSelectedCover();
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>编辑商品</DialogTitle>
        <DialogDescription>更新商品信息和展示内容。</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" @submit="onSubmit">
        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="name">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>商品名称</FieldLabel>
            <Input
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="例如：限定周边"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="pointTypeId">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>积分类型</FieldLabel>
            <NativeSelect
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="field.onChange(String($event))"
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

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="price">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>兑换价格</FieldLabel>
            <Input
              :model-value="field.value"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              min="1"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="stock">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>初始库存</FieldLabel>
            <Input
              :model-value="field.value ?? 0"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              min="0"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="deliveryType">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>发货方式</FieldLabel>
            <NativeSelect
              :model-value="field.value ?? ProductDeliveryType.Manual"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="field.onChange(toProductDeliveryType($event))"
            >
              <NativeSelectOption :value="ProductDeliveryType.Manual">人工发货</NativeSelectOption>
              <NativeSelectOption :value="ProductDeliveryType.Automatic">
                自动发货
              </NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="status">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>商品状态</FieldLabel>
            <NativeSelect
              :model-value="field.value ?? ProductStatus.Disabled"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="field.onChange(toProductStatus($event))"
            >
              <NativeSelectOption :value="ProductStatus.Active">上架</NativeSelectOption>
              <NativeSelectOption :value="ProductStatus.Disabled">下架</NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="startTime">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>开始时间</FieldLabel>
            <Input
              :model-value="toDatetimeLocalValue(field.value)"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(fromDatetimeLocalValue($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="endTime">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>结束时间</FieldLabel>
            <Input
              :model-value="toDatetimeLocalValue(field.value)"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="datetime-local"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(fromDatetimeLocalValue($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="allowCancel">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>允许取消订单</FieldLabel>
            <NativeSelect
              :model-value="String(field.value ?? false)"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              @blur="field.onBlur"
              @update:model-value="field.onChange(toBooleanSelectValue($event))"
            >
              <NativeSelectOption value="false">不允许</NativeSelectOption>
              <NativeSelectOption value="true">允许</NativeSelectOption>
            </NativeSelect>

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="sort">
          <Field :data-invalid="fieldMeta.touched && errors.length > 0">
            <FieldLabel>排序</FieldLabel>
            <Input
              :model-value="field.value ?? 0"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              type="number"
              step="1"
              @blur="field.onBlur"
              @input="field.onChange(Number($event.target.value))"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ errors, meta: fieldMeta }" name="cover">
          <Field
            class="sm:col-span-2 lg:col-span-3"
            :data-invalid="fieldMeta.touched && errors.length > 0"
          >
            <FieldLabel>封面</FieldLabel>
            <ProductCoverCropDialog
              ref="productCoverCropDialog"
              v-model:file="coverFile"
              :current-cover-url="currentCoverUrl"
              :invalid="fieldMeta.touched && errors.length > 0"
              :preview-size="coverCropPreviewSize"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="description">
          <Field
            class="sm:col-span-2 lg:col-span-3"
            :data-invalid="fieldMeta.touched && errors.length > 0"
          >
            <FieldLabel>描述</FieldLabel>
            <Textarea
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="可选"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <FormField v-slot="{ field, errors, meta: fieldMeta }" name="detail">
          <Field
            class="sm:col-span-2 lg:col-span-3"
            :data-invalid="fieldMeta.touched && errors.length > 0"
          >
            <FieldLabel>详情</FieldLabel>
            <Textarea
              v-bind="field"
              :model-value="field.value ?? ''"
              :aria-invalid="fieldMeta.touched && errors.length > 0"
              placeholder="可选，支持 Markdown / HTML / 富文本 JSON"
            />

            <FieldError :errors="errors" />
          </Field>
        </FormField>

        <DialogFooter class="sm:col-span-2 lg:col-span-3">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button
            type="submit"
            :disabled="isLoading || activePointTypes.length === 0 || !meta.valid"
          >
            <Loader2 v-if="isLoading" class="animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
