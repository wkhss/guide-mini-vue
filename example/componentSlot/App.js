import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App={
    // App.vue
    name:'App',
    render(){
        const app=h('div',{},'App')
        // const foo=h(Foo,{},[h('p',{},'123'),h('p',{},'456')])
        // const foo=h(Foo,{},h('p',{},'456'))

        // 具名插槽
        // const foo=h(Foo,{},{
        //     'header':h('p',{},'header'),
        //     'footer':h('p',{},'footer')
        // })

        // 作用域插槽
        const foo=h(Foo,{},{
            header:({ age })=>h('p',{},'header'+age),
            footer:()=>h('p',{},'footer')
        })

        return h('div',{},[app,foo])
    },
    setup(){
        return {
        }
    }
}