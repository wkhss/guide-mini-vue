import { createRender } from "../runtime-core"

function createElement(type){
    return document.createElement(type)
}

function patchProp(el,key,val){
    // on + Event name 
    const isOn=(key:string)=>/^on[A-Z]/.test(key)
    if(isOn(key)){//if(key === 'onClick'){
        const event=key.slice(2).toLowerCase()
        el.addEventListener(event,val)
    }else{
        el.setAttribute(key,val)
    }
}

function insert(el,parent){
    parent.append(el)
}

const render:any=createRender({
    createElement,
    patchProp,
    insert,
})

export function createApp(...arg){
    return render.createApp(...arg)
}

export * from "../runtime-core";
