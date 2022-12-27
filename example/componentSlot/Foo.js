import { h,renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo={
    setup(){
        return {}
    },
    render(){
        const foo=h('p',{},'foo')

        console.log(this.$slots);
        // return h('div',{},[foo,renderSlots(this.$slots)])
        // 具名插槽
        // return h('div',{},[renderSlots(this.$slots,'header'),foo,renderSlots(this.$slots,'footer')])
        // 作用域插槽
        const age='18'
        return h('div',{},[renderSlots(this.$slots,'header',{
            age
        }),foo,renderSlots(this.$slots,'footer')])
    }
}