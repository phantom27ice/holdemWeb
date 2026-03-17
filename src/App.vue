<script setup>
</script>

<template>
  <div class="app-shell">
    <header class="header">
      <h1 class="brand">Holdem Web</h1>
      <nav class="nav">
        <RouterLink to="/" class="nav-link">Home</RouterLink>
        <RouterLink to="/about" class="nav-link">About</RouterLink>
      </nav>
    </header>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.brand {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: #334155;
  text-decoration: none;
  font-weight: 500;
}

.nav-link.router-link-exact-active {
  color: #2563eb;
}

.content {
  padding-top: 0.5rem;
}
</style>
