<script setup lang="ts">
import { Button } from '@gr/ui';

import { api } from '#web-admin/lib/api';

api.auth.login
  .post({
    username: 'admin',
    password: 'admin',
    biliUid: '2131232',
  })
  .then(res => {
    if (res) {
      console.log(res);
    }
  });
</script>

<template>
  <div>
    <h1>You did it!</h1>
    <p>
      Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
      documentation
    </p>
    <Button>123123</Button>
  </div>
</template>

<style scoped></style>
