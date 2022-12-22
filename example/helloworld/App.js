import { h } from '../../lib/guide-mini-vue.esm.js'
export const App={
    // App.vue
    // <template></template> -> render
    render(){
        // return h('div','hello '+this.msg)
        // return h('div',{},'hello')
        return h('div',{
            id:'root',
            class:['root','hard']
        },[h('p',{class:'red'},'hi'),h('p',{class:'blue'},'mini-vue')])
    },
    setup(){
        return {
            msg:'mini-vue'
        }
    }
}