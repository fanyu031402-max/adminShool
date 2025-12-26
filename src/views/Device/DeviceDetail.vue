<template>
  <div class="device-detail">
    <h2>设备详情 - {{ device.name }}</h2>
    <div class="detail-card">
      <div class="detail-row">
        <span class="label">设备ID:</span>
        <span>{{ device.id }}</span>
      </div>
      <div class="detail-row">
        <span class="label">状态:</span>
        <span :class="`status-${device.status}`">{{ device.status }}</span>
      </div>
      <div class="detail-row">
        <span class="label">最后在线:</span>
        <span>{{ device.lastOnline }}</span>
      </div>
    </div>
    <button @click="$router.go(-1)">返回</button>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      device: {
        id: this.id,
        name: `设备${this.id}`,
        status: 'online',
        lastOnline: new Date().toLocaleString()
      }
    }
  }
}
</script>

<style scoped>
.detail-card {
  border: 1px solid #eee;
  padding: 20px;
  margin: 20px 0;
  border-radius: 4px;
}
.detail-row {
  margin: 10px 0;
}
.label {
  font-weight: bold;
  margin-right: 10px;
}
.status-online {
  color: green;
}
.status-offline {
  color: red;
}
</style>