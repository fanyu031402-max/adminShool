<template>
    <svg :class="svgClass" aria-hidden="true">
        <use :xlink:href="iconName"></use>
    </svg>
</template>
<script>
export default {
    name: "svgIcon",
    // props: ['iconClass', 'className'],
    props: {
        // 分页
        iconClass: {
            type: String,  // 定义接收的值类型
            default: ''
        },
        className : {
            type: String,
            default: ''
        }
    },
    computed: {
        iconName(){
            return `#icon-${this.iconClass}`
        },
        svgClass(){
            if(this.className) {
                return `svg-icon ${this.className}`
            }else{
                return `svg-icon`
            }
        }
    }
}
</script>
<style lang="less" scoped>
.svg-icon {
    width: 1em;
    height: 1em;
    fill: currentColor;
}
</style>
