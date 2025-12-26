<template>
  <div class="nav-bar">
    <router-link to="/dashboard" class="nav-item">
      <i class="icon-dashboard"></i>
      <span>工作台</span>
    </router-link>
    <router-link to="/devices" class="nav-item">
      <i class="icon-devices"></i>
      <span>设备管理</span>
    </router-link>
    <router-link to="/events" class="nav-item">
      <i class="icon-events"></i>
      <span>事件管理</span>
    </router-link>
    <router-link to="/settings" class="nav-item">
      <i class="icon-settings"></i>
      <span>个人设置</span>
    </router-link>
  </div>
</template>

<style scoped>
.nav-bar {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  background: #f5f5f5;
  position: fixed;
  bottom: 0;
  width: 100%;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>