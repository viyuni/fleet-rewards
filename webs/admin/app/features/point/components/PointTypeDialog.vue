<script setup lang="ts">
import {
  CreatePointTypeSchema,
  type CreatePointTypeBody,
  type UpdatePointTypeBody,
} from '@internal/shared/point-type';
import { useForm } from '@tanstack/vue-form';
import { Button } from '@web/ui/components/ui/button';
import { Loader2 } from 'lucide-vue-next';

import { useCreatePointType, useUpdatePointType } from '../mutations';
import type { PointType } from './PointTypeListView.vue';

const props = defineProps<{
  pointType?: PointType;
}>();

const open = defineModel<boolean>('open', { default: false });

const { mutateAsync: createPointType, isLoading: isCreating } = useCreatePointType();
const { mutateAsync: updatePointType, isLoading: isUpdating } = useUpdatePointType();

const isEditing = computed(() => Boolean(props.pointType));
const isLoading = computed(() => isCreating.value || isUpdating.value);

function createDefaultValues(pointType?: PointType): CreatePointTypeBody {
  return {
    name: pointType?.name ?? '',
    description: pointType?.description ?? undefined,
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

const form = useForm({
  validators: {
    onSubmit: CreatePointTypeSchema,
  },
  defaultValues: createDefaultValues(props.pointType),
  async onSubmit({ value }: { value: CreatePointTypeBody }) {
    if (props.pointType) {
      await updatePointType({
        pointTypeId: props.pointType.id,
        body: value satisfies UpdatePointTypeBody,
      });
    } else {
      await createPointType(value);
    }

    form.reset(createDefaultValues(props.pointType));
    open.value = false;
  },
});

watch(
  () => props.pointType,
  pointType => {
    form.reset(createDefaultValues(pointType));
  },
);

watch(open, isOpen => {
  if (!isOpen) {
    form.reset(createDefaultValues(props.pointType));
  }
});
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isEditing ? '编辑积分类型' : '添加积分类型' }}</DialogTitle>
        <DialogDescription>
          {{ isEditing ? '更新积分类型的展示信息。' : '创建可用于发放、兑换和调整的积分类型。' }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="form.handleSubmit">
        <form.Field name="name" #default="{ field }">
          <FieldControl :field="field" label="名称" v-slot="{ id, invalid }">
            <Input
              :id="id"
              :model-value="field.state.value"
              :aria-invalid="invalid"
              placeholder="例如：舰队积分"
              @blur="field.handleBlur"
              @input="field.handleChange($event.target.value)"
            />
          </FieldControl>
        </form.Field>

        <form.Field name="description" #default="{ field }">
          <FieldControl :field="field" label="描述" v-slot="{ id, invalid }">
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

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" type="button">取消</Button>
          </DialogClose>
          <Button type="submit" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="animate-spin" />
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
