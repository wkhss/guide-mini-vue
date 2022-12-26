import { h } from "../../lib/guide-mini-vue.esm.js";

export const Foo={
    setup(props){
        // 1.在setup中可以访问到props
        console.log(props);
        // 3.props 是 shallowReadonly
        
        props.count++
        // console.log(props.count);
    },
    render(){
        // 2.在render中可以访问到props中的属性
        return h('div',{},'foo:'+this.count)
    }
}