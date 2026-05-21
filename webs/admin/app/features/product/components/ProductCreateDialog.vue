<script setup lang="ts">
import { CreateProductSchema, ProductDeliveryType, ProductStatus } from '@internal/shared/product';
import { Button } from '@web/ui/components/ui/button';
import { FormFieldItem, type FormInput, usePopoverForm } from '@web/ui/components/ui/form';
import { Loader2 } from 'lucide-vue-next';

import PointTypeSelect from '../../point/components/PointTypeSelect.vue';
import { useCreateProduct } from '../mutations';
import ProductCoverCropDialog from './ProductCoverCropDialog.vue';

const open = defineModel<boolean>('open', { default: false });

const createProductMutation = useCreateProduct();

const productCoverCropDialog = ref<InstanceType<typeof ProductCoverCropDialog>>();
const coverCropPreviewSize = 320;
const {
  public: { apiBaseUrl },
} = useRuntimeConfig();
const imageBaseUrl = computed(() => apiBaseUrl.replace(/\/$/, ''));
const currentCoverUrl = computed(() => undefined);

type ProductCreateFormValues = FormInput<typeof CreateProductSchema>;

function createDefaultValues(): ProductCreateFormValues {
  return {
    name: '',
    description: undefined,
    cover: undefined,
    detail: undefined,
    pointTypeId: '',
    price: 1,
    status: ProductStatus.Disabled,
    stock: 0,
    deliveryType: ProductDeliveryType.Manual,
    startTime: undefined,
    endTime: undefined,
    allowCancel: false,
    sort: 0,
    metadata: undefined,
  };
}

function resetSelectedCover() {
  productCoverCropDialog.value?.reset();
}

const { canSubmit, handleSubmit, isLoading, onSubmitSuccess } = usePopoverForm({
  schema: CreateProductSchema,
  open,
  initialValues: createDefaultValues,
  mutation: createProductMutation,
});

onSubmitSuccess(() => {
  resetSelectedCover();
});

watch(open, isOpen => {
  if (!isOpen) {
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

      <form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" @submit="handleSubmit">
        <FormFieldItem v-slot="{ componentField }" name="name" label="商品名称" required>
          <Input v-bind="componentField" placeholder="例如：限定周边" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="pointTypeId" label="积分类型" required>
          <PointTypeSelect v-bind="componentField" placeholder="选择积分类型" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="price" label="兑换价格" required>
          <Input v-bind="componentField" type="number" min="1" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="stock" label="初始库存" required>
          <Input v-bind="componentField" type="number" min="0" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="deliveryType" label="发货方式" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption :value="ProductDeliveryType.Manual">人工发货</NativeSelectOption>
            <NativeSelectOption :value="ProductDeliveryType.Automatic">自动发货</NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="status" label="商品状态" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption :value="ProductStatus.Active">上架</NativeSelectOption>
            <NativeSelectOption :value="ProductStatus.Disabled">下架</NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="startTime" label="开始时间">
          <Input v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="endTime" label="结束时间">
          <Input v-bind="componentField" type="datetime-local" step="1" />
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="allowCancel" label="允许取消订单" required>
          <NativeSelect v-bind="componentField">
            <NativeSelectOption :value="false">不允许</NativeSelectOption>
            <NativeSelectOption :value="true">允许</NativeSelectOption>
          </NativeSelect>
        </FormFieldItem>

        <FormFieldItem v-slot="{ componentField }" name="sort" label="排序" required>
          <Input v-bind="componentField" type="number" step="1" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ field, invalid }"
          class="sm:col-span-2 lg:col-span-3"
          name="cover"
          label="封面"
        >
          <ProductCoverCropDialog
            ref="productCoverCropDialog"
            :file="field.value"
            :current-cover-url="currentCoverUrl"
            :invalid="invalid"
            :preview-size="coverCropPreviewSize"
            @blur="field.onBlur($event)"
            @update:file="field.onChange"
          />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2 lg:col-span-3"
          name="description"
          label="描述"
        >
          <Textarea v-bind="componentField" placeholder="可选" />
        </FormFieldItem>

        <FormFieldItem
          v-slot="{ componentField }"
          class="sm:col-span-2 lg:col-span-3"
          name="detail"
          label="详情"
        >
          <Textarea
            v-bind="componentField"
            placeholder="可选，支持 Markdown / HTML / 富文本 JSON"
          />
        </FormFieldItem>

        <DialogFooter class="sm:col-span-2 lg:col-span-3">
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isLoading" class="animate-spin" />
            创建
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
