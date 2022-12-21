import { h } from '../../lib/guide-mini-vue.esm.js'
export const App={
    // App.vue
    // <template></template> -> render
    render(){
        return h('div','hello '+this.msg)
    },
    setup(){
        return {
            msg:'mini-vue'
        }
    }
}