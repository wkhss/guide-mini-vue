import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self=null
export const App={
    // App.vue
    // <template></template> -> render
    name:'App',
    render(){
        window.self=this
        return h('div',{
                id:'root',
                // onClick(){
                //     console.log('click');
                // },
                // onMousedown(){
                //     console.log('mousedown');
                // }
            },
                // this.msg -> setupState
                // this.$el -> get root element 根组件 div DOM实例
                // 'hello '+this.msg

                [h('div',{},'hi,'+this.msg),h(Foo,{count:1})]
            )
        // return h('div',{},'hello')
        // return h('div',{
        //     id:'root',
        //     class:['root','hard']
        // },[h('p',{class:'red'},'hi'),h('p',{class:'blue'},'mini-vue')])
    },
    setup(){
        return {
            msg:'mini-vue'
        }
    }
}