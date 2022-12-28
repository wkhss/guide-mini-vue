import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots,name,props){
    // return createVNode('div',{},slots)

    const slot=slots[name]
    if(slot){
        if(typeof slot === 'function'){
            // children 不可以有 array
            // return createVNode('div',{},slot(props))

            // Fragment
            return createVNode(Fragment,{},slot(props))
        }
    }
}