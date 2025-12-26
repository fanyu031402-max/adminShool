<!-- components/HighlightText.vue -->
<template>
    <div class="highlight-text">
      <span v-for="(fragment, index) in fragments" :key="index" 
            :class="{ 'highlight': fragment.highlight }">
        {{ fragment.text }}
      </span>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      text: String,
      keywords: Array
    },
  
    computed: {
      fragments() {
        const regex = new RegExp(`(${this.keywords.join('|')})`, 'gi')
        return this.text.split(regex).map(text => ({
          text,
          highlight: this.keywords.some(kw => 
            kw.toLowerCase() === text.toLowerCase()
          )
        }))
      }
    }
  }
  </script>
  
  <style scoped>
  .highlight {
    background-color: #fff3e0;
    color: #e65100;
    padding: 2px 4px;
    border-radius: 3px;
  }
  </style>
  